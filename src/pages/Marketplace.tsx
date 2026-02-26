import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, Zap, Users, TrendingUp, Filter, ExternalLink, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

interface MarketplaceTemplate {
  id: string;
  external_id: string;
  title: string;
  description: string | null;
  preview_image_url: string | null;
  categories: string[];
  creator_name: string | null;
  creator_url: string | null;
  original_url: string;
  nodes_used: string[];
  is_free: boolean;
  price: number | null;
  source: string;
  created_at: string;
}

const Marketplace = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalNodes: 0,
  });

  // Fetch templates from database
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('marketplace_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching templates:', error);
        } else {
          setTemplates(data || []);
          
          // Calculate stats
          const allNodes = new Set<string>();
          (data || []).forEach(t => {
            t.nodes_used?.forEach((n: string) => allNodes.add(n));
          });
          
          setStats({
            totalTemplates: data?.length || 0,
            totalNodes: allNodes.size,
          });
        }
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Extract unique categories from templates
  const allCategories = Array.from(
    new Set(templates.flatMap(t => t.categories || []))
  ).slice(0, 6);
  
  const categories = ["all", ...allCategories];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      template.nodes_used?.some(n => n.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = 
      selectedCategory === "all" || 
      template.categories?.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            {t('marketplace.title', 'n8n Workflow Marketplace')}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            {t('marketplace.subtitle', 'Discover and deploy automation workflows from the n8n community')}
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder={t('marketplace.search_placeholder', 'Search workflows, nodes, or categories...')}
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-10 h-12 text-base" 
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalTemplates || '500+'}</div>
              <div className="text-sm text-muted-foreground">{t('marketplace.templates', 'Templates')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalNodes || '100+'}</div>
              <div className="text-sm text-muted-foreground">{t('marketplace.unique_nodes', 'Unique Nodes')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">n8n</div>
              <div className="text-sm text-muted-foreground">{t('marketplace.official_source', 'Official Source')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{t('marketplace.free', 'Free')}</div>
              <div className="text-sm text-muted-foreground">{t('marketplace.open_source', 'Open Source')}</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="container mx-auto px-4 pb-12">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <TabsList className="grid grid-cols-3 md:flex md:w-auto w-full">
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category === 'all' ? t('marketplace.all', 'All') : category}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {t('marketplace.source_label', 'Source')}: n8n Official
              </Badge>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {t('marketplace.filters', 'Filters')}
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">{t('marketplace.loading', 'Loading templates...')}</span>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-20">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">{t('marketplace.no_templates', 'No templates found')}</h3>
              <p className="text-muted-foreground">
                {templates.length === 0 
                  ? t('marketplace.run_scraper', 'Run the template scraper to populate the marketplace.')
                  : t('marketplace.try_different_search', 'Try a different search term or category.')}
              </p>
            </div>
          ) : (
            /* Template Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => navigate(`/marketplace/template/${template.id}`)}
                >
                  <CardHeader className="p-0">
                    <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                      {template.preview_image_url ? (
                        <img 
                          src={template.preview_image_url} 
                          alt={template.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <Zap className={`h-12 w-12 text-muted-foreground ${template.preview_image_url ? 'hidden' : ''}`} />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">n8n</Badge>
                      <Badge variant={template.is_free ? "default" : "outline"}>
                        {template.is_free ? t('marketplace.free', 'Free') : `$${template.price}`}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mb-2 line-clamp-1">{template.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description || t('marketplace.no_description', 'No description available')}
                    </CardDescription>
                    
                    {/* Nodes Used */}
                    {template.nodes_used && template.nodes_used.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {template.nodes_used.slice(0, 3).map((node, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {node}
                          </Badge>
                        ))}
                        {template.nodes_used.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.nodes_used.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Creator Attribution */}
                    {template.creator_name && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        {t('marketplace.created_by', 'by')} {template.creator_name}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <a 
                      href={template.original_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {t('marketplace.view_on_n8n', 'View on n8n')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button size="sm">{t('marketplace.view_details', 'View Details')}</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </Tabs>
      </section>

      <Footer />
    </div>
  );
};

export default Marketplace;
