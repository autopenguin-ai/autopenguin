import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PropertyRow {
  "Title": string;
  "Property Code": string;
  "Address": string;
  "Price": string;
  "Property Type": string;
  "Status": string;
  "Bedrooms": string;
  "Bathrooms": string;
  "Square Feet": string;
  "District": string;
  "Description": string;
  "Photos": string;
  "Facilities": string;
  "Features": string;
  "Is Featured": string;
  "Owner": string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseCSVContent(csvContent: string): string[][] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if (char === '\n' && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  
  if (currentLine.trim()) {
    lines.push(currentLine);
  }
  
  return lines.map(line => parseCSVLine(line));
}

function parseJSON(str: string): any {
  try {
    if (!str || str.trim() === '') return null;
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON parse error:', error, 'for string:', str);
    return null;
  }
}

function parseArray(str: string): string[] {
  try {
    if (!str || str.trim() === '') return [];
    if (str.startsWith('[') && str.endsWith(']')) {
      return JSON.parse(str);
    } else {
      return str.split(',').map(item => item.trim().replace(/^["']|["']$/g, ''));
    }
  } catch (error) {
    console.error('Array parse error:', error, 'for string:', str);
    return [];
  }
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr || priceStr === 'POA' || priceStr === "'-") return null;
  
  const cleanPrice = priceStr.replace(/[^\d.]/g, '');
  const price = parseFloat(cleanPrice);
  
  if (isNaN(price)) return null;
  
  let finalPrice = price;
  if (priceStr.includes('億')) {
    finalPrice = price * 100000000;
  } else if (priceStr.includes('萬')) {
    finalPrice = price * 10000;
  }
  
  const maxValue = 9999999999999.99;
  if (finalPrice > maxValue) {
    console.warn(`Price ${finalPrice} exceeds max database value, capping at ${maxValue}`);
    return maxValue;
  }
  
  return Math.round(finalPrice * 100) / 100;
}

function transformPropertyData(row: PropertyRow, ownerLookup: Map<string, string>, existingCodes: Set<string>): any {
  const facilities = parseJSON(row["Facilities"]);
  const features = parseJSON(row["Features"]);
  const photos = parseArray(row["Photos"]);
  
  const address = row["Address"]?.trim() || row["Title"]?.trim() || 'Unknown Location';
  
  let propertyCode = row["Property Code"]?.trim() || null;
  if (propertyCode && existingCodes.has(propertyCode)) {
    propertyCode = `${propertyCode}-${Math.random().toString(36).substr(2, 6)}`;
  }
  if (propertyCode) {
    existingCodes.add(propertyCode);
  }
  
  return {
    title: row["Title"]?.trim() || 'Untitled Property',
    property_code: propertyCode,
    address: address,
    price: parsePrice(row["Price"]),
    property_type: row["Property Type"]?.trim() || 'OTHER',
    status: row["Status"]?.trim() || 'AVAILABLE',
    bedrooms: row["Bedrooms"] ? parseInt(row["Bedrooms"]) : null,
    bathrooms: row["Bathrooms"] ? parseInt(row["Bathrooms"]) : null,
    square_feet: row["Square Feet"] ? parseInt(row["Square Feet"]) : null,
    district: row["District"]?.trim() || address.split(/[,，]/)?.[0] || null,
    description: row["Description"]?.trim() || null,
    photos: photos || [],
    facilities: facilities || {},
    features: features || {},
    is_featured: row["Is Featured"] === 'true' || row["Is Featured"] === '1',
    owner_id: ownerLookup.get(row["Owner"]) || null
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting CSV import process...');

    const { csvContent } = await req.json();
    
    if (!csvContent) {
      throw new Error('No CSV content provided');
    }

    const parsedRows = parseCSVContent(csvContent);
    const headers = parsedRows[0];
    
    console.log('CSV Headers:', headers);
    console.log('Total rows parsed:', parsedRows.length);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id');
    
    const ownerLookup = new Map();
    if (profiles) {
      profiles.forEach((profile: any) => {
        ownerLookup.set(profile.user_id, profile.id);
      });
    }

    console.log('Owner lookup created with', ownerLookup.size, 'entries');

    const processedProperties = [];
    const errors = [];
    const existingCodes = new Set<string>();

    const { data: existingProps, error: existingPropsError } = await supabase
      .from('properties')
      .select('property_code');

    if (existingPropsError) {
      console.error('Error fetching existing properties:', existingPropsError);
    } else if (existingProps) {
      existingProps.forEach((p: any) => {
        if (p.property_code) existingCodes.add(String(p.property_code).trim());
      });
      console.log('Seeded duplicates set with', existingCodes.size, 'codes');
    }

    for (let i = 1; i < parsedRows.length; i++) {
      try {
        const rowData = parsedRows[i];
        
        if (!rowData || rowData.every(val => !val || val.trim() === '')) {
          console.log(`Skipping empty row ${i}`);
          continue;
        }
        
        const rowObj: any = {};
        headers.forEach((header, index) => {
          rowObj[header] = rowData[index] || '';
        });
        
        const transformedProperty = transformPropertyData(rowObj as PropertyRow, ownerLookup, existingCodes);
        processedProperties.push(transformedProperty);
        
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        errors.push({ row: i, error: (error as Error).message });
      }
    }

    console.log(`Processed ${processedProperties.length} properties, ${errors.length} errors`);

    const batchSize = 10;
    const insertedProperties = [];
    const insertErrors = [];

    for (let i = 0; i < processedProperties.length; i += batchSize) {
      const batch = processedProperties.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('properties')
          .insert(batch)
          .select();

        if (error) {
          console.error('Batch insert error:', error);
          insertErrors.push({ batch: i / batchSize, error: error.message });
        } else {
          insertedProperties.push(...(data || []));
          console.log(`Successfully inserted batch ${i / batchSize + 1}`);
        }
      } catch (error) {
        console.error(`Error inserting batch ${i / batchSize}:`, error);
        insertErrors.push({ batch: i / batchSize, error: (error as Error).message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'CSV import completed',
        stats: {
          totalRows: parsedRows.length - 1,
          processedProperties: processedProperties.length,
          insertedProperties: insertedProperties.length,
          processingErrors: errors.length,
          insertErrors: insertErrors.length
        },
        errors: [...errors, ...insertErrors]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Import error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});