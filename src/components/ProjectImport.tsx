import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface ImportStats {
  totalRows: number;
  processedProperties: number;
  insertedProperties: number;
  processingErrors: number;
  insertErrors: number;
}

export default function PropertyImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setImportComplete(false);
        setErrors([]);
      } else {
        toast({
          title: t('property-import.toast.invalid-file.title'),
          description: t('property-import.toast.invalid-file.description'),
          variant: "destructive",
        });
      }
    }
  };

  const handleImportCSV = async () => {
    if (!selectedFile) {
      toast({
        title: t('property-import.toast.no-file.title'),
        description: t('property-import.toast.no-file.description'),
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportComplete(false);
    setErrors([]);
    
    try {
      // Read the selected file
      const csvContent = await selectedFile.text();

      if (!csvContent) {
        throw new Error('Could not read CSV file content');
      }

      console.log('Importing CSV with content length:', csvContent.length);

      // Call the import edge function
      const { data, error } = await supabase.functions.invoke('import-properties', {
        body: { csvContent }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setImportStats(data.stats);
        setErrors(data.errors || []);
        setImportComplete(true);
        
        toast({
          title: t('property-import.toast.success.title'),
          description: t('property-import.toast.success.description', { count: data.stats.insertedProperties }),
        });
      } else {
        throw new Error(data.error || 'Import failed');
      }

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: t('property-import.toast.failed.title'),
        description: (error as any).message || t('property-import.toast.failed.description'),
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('import-properties-csv')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!importComplete && !isImporting && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('property-import.instructions')}
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="csv-file" className="text-sm font-medium">
                    {t('property-import.select-file-label')}
                  </label>
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90
                      file:cursor-pointer cursor-pointer"
                  />
                  {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    {t('property-import.selected-file', { name: selectedFile.name, size: (selectedFile.size / 1024).toFixed(1) })}
                  </p>
                  )}
                </div>
                
                <Button 
                  onClick={handleImportCSV}
                  disabled={isImporting || !selectedFile}
                  className="w-full"
                >
                  {selectedFile ? t('property-import.import-button') : t('property-import.select-file-first')}
                </Button>
              </div>
            </div>
          )}

          {isImporting && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span>{t('property-import.importing')}</span>
              </div>
              <Progress value={50} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {t('property-import.processing')}
              </p>
            </div>
          )}

          {importComplete && importStats && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('property-import.success-alert')}
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importStats.insertedProperties}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('property-import.stats.properties-imported')}
                  </div>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {importStats.totalRows}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('property-import.stats.total-rows')}
                  </div>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {importStats.processingErrors + importStats.insertErrors}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('property-import.stats.total-errors')}
                  </div>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {importStats.processedProperties}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('property-import.stats.processed')}
                  </div>
                </div>
              </div>

              {errors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">{t('property-import.errors-title', { count: errors.length })}</p>
                      <div className="max-h-32 overflow-y-auto text-xs">
                        {errors.map((error, index) => (
                          <div key={index} className="text-red-600">
                            {t('property-import.row', { num: error.row || error.batch })}: {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={() => {
                  setImportComplete(false);
                  setImportStats(null);
                  setErrors([]);
                  setSelectedFile(null);
                  // Reset file input
                  const fileInput = document.getElementById('csv-file') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                variant="outline"
                className="w-full"
              >
                {t('property-import.import-another')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}