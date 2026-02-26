import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const MarketplaceCreateTemplate = () => {
  const { templateId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEditing = !!templateId;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    longDescription: "",
    platform: "",
    category: "",
    price: "",
    tags: [] as string[]
  });

  const [currentTag, setCurrentTag] = useState("");

  const handleAddTag = () => {
    if (currentTag && !formData.tags.includes(currentTag)) {
      setFormData({ ...formData, tags: [...formData.tags, currentTag] });
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const handleSubmit = () => {
    // Placeholder for submit logic
    console.log("Submitting template:", formData);
    navigate("/marketplace/creator");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => navigate("/marketplace/creator")}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "Edit Template" : "Create New Template"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "Update your template details" : "Add a new template to the marketplace"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Provide essential details about your template
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Template Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Lead Scoring Automation"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Short Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="A brief description (max 160 characters)"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longDescription">Full Description *</Label>
                    <Textarea
                      id="longDescription"
                      placeholder="Detailed description of what your template does and how it helps users"
                      rows={6}
                      value={formData.longDescription}
                      onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="platform">Platform *</Label>
                      <Select 
                        value={formData.platform}
                        onValueChange={(value) => setFormData({ ...formData, platform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="n8n">n8n</SelectItem>
                          <SelectItem value="make">Make</SelectItem>
                          <SelectItem value="zapier">Zapier</SelectItem>
                          <SelectItem value="langchain">LangChain</SelectItem>
                          <SelectItem value="langflow">Langflow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="crm">CRM</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        placeholder="Add tags (press Enter)"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddTag}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => handleRemoveTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Template Files</CardTitle>
                  <CardDescription>
                    Upload your workflow files and media
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Workflow Template *</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JSON or YAML files (max 10MB)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Thumbnail Image *</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload thumbnail
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG or JPG (recommended: 800x600px)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Additional Screenshots</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Upload screenshots
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Up to 5 images
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                  <CardDescription>
                    Set your template pricing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Set to 0 for free templates
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-medium">Pricing Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Template Price</span>
                        <span>${formData.price || "0.00"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee (15%)</span>
                        <span>-${((parseFloat(formData.price) || 0) * 0.15).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t">
                        <span>You Earn</span>
                        <span>${((parseFloat(formData.price) || 0) * 0.85).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Template Preview</CardTitle>
                  <CardDescription>
                    This is how your template will appear in the marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-6 space-y-4">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Thumbnail Preview</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{formData.title || "Template Title"}</h3>
                      <p className="text-muted-foreground mt-2">
                        {formData.description || "Template description will appear here"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {formData.platform && <Badge>{formData.platform}</Badge>}
                      {formData.category && <Badge variant="outline">{formData.category}</Badge>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publish Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={handleSubmit}>
                {isEditing ? "Update Template" : "Publish Template"}
              </Button>
              <Button variant="outline" className="w-full">
                Save as Draft
              </Button>
              {isEditing && (
                <Button variant="destructive" className="w-full">
                  Delete Template
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p className="text-muted-foreground">
                  Provide clear and accurate descriptions
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p className="text-muted-foreground">
                  Include comprehensive documentation
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p className="text-muted-foreground">
                  Test your template thoroughly
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p className="text-muted-foreground">
                  Use high-quality screenshots
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceCreateTemplate;
