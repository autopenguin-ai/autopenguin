import { useParams, useNavigate } from "react-router-dom";
import { PublicHeader } from "@/components/PublicHeader";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Check, Download, Share2, Heart, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const MarketplaceTemplate = () => {
  const { templateId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Mock template data
  const template = {
    id: templateId,
    title: "Lead Scoring Automation",
    description: "Automatically score and qualify leads based on behavior and demographics. This comprehensive workflow analyzes multiple data points to help your sales team focus on the most promising opportunities.",
    longDescription: "This advanced lead scoring automation integrates with your CRM to analyze prospect behavior, engagement metrics, and demographic information. It assigns scores in real-time and triggers notifications when leads reach qualification thresholds.",
    creator: {
      name: "John Doe",
      avatar: "JD",
      rating: 4.9,
      totalSales: 1240,
      responseTime: "< 2 hours"
    },
    rating: 4.8,
    reviews: 124,
    price: "$49",
    platform: "n8n",
    category: "CRM",
    features: [
      "Real-time lead scoring",
      "Multi-criteria analysis",
      "CRM integration",
      "Automated notifications",
      "Customizable scoring rules",
      "Analytics dashboard"
    ],
    requirements: [
      "n8n version 1.0 or higher",
      "CRM integration (Salesforce, HubSpot, or Pipedrive)",
      "Email service provider"
    ],
    included: [
      "Complete n8n workflow template",
      "Setup documentation",
      "Video tutorial",
      "Email support for 30 days"
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate("/marketplace")}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Preview */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">⚡</div>
                    <p className="text-muted-foreground">Template Preview</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{template.longDescription}</p>
                    
                    <div>
                      <h3 className="font-semibold mb-2">What's Included</h3>
                      <ul className="space-y-2">
                        {template.included.map((item, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Requirements</h3>
                      <ul className="space-y-2">
                        {template.requirements.map((req, index) => (
                          <li key={index} className="flex items-center gap-2 text-muted-foreground">
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {template.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-primary shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Reviews</CardTitle>
                    <CardDescription>{template.reviews} reviews</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[1, 2, 3].map((_, index) => (
                      <div key={index} className="space-y-2 pb-6 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>U{index + 1}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">User {index + 1}</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-primary text-primary" />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">2 days ago</span>
                        </div>
                        <p className="text-muted-foreground">
                          Great template! Saved me hours of work. Easy to customize and integrate with our existing systems.
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl">{template.price}</CardTitle>
                    <CardDescription>One-time payment</CardDescription>
                  </div>
                  <Badge variant="secondary">{template.platform}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  Purchase Template
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-1 pt-2">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="font-semibold">{template.rating}</span>
                  <span className="text-muted-foreground">({template.reviews} reviews)</span>
                </div>
              </CardContent>
            </Card>

            {/* Creator Card */}
            <Card>
              <CardHeader>
                <CardTitle>About the Creator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{template.creator.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{template.creator.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {template.creator.totalSales} sales
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium">{template.creator.rating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response time</span>
                    <span className="font-medium">{template.creator.responseTime}</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  Contact Creator
                </Button>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform</span>
                  <Badge variant="outline">{template.platform}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>2 weeks ago</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MarketplaceTemplate;
