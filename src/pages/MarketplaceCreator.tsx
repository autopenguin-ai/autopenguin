import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, DollarSign, Download, TrendingUp, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

// Mock data
const mockTemplates = [
  {
    id: "1",
    title: "Lead Scoring Automation",
    status: "Published",
    sales: 124,
    revenue: "$6,076",
    views: 2340,
    rating: 4.8
  },
  {
    id: "2",
    title: "Email Marketing Campaign",
    status: "Published",
    sales: 89,
    revenue: "$3,471",
    views: 1820,
    rating: 4.9
  },
  {
    id: "3",
    title: "Social Media Scheduler",
    status: "Draft",
    sales: 0,
    revenue: "$0",
    views: 0,
    rating: 0
  }
];

const MarketplaceCreator = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [templates] = useState(mockTemplates);

  const totalRevenue = templates.reduce((acc, t) => {
    const revenue = parseFloat(t.revenue.replace(/[$,]/g, ''));
    return acc + revenue;
  }, 0);

  const totalSales = templates.reduce((acc, t) => acc + t.sales, 0);
  const publishedCount = templates.filter(t => t.status === "Published").length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your templates and track performance
          </p>
        </div>
        <Button onClick={() => navigate("/marketplace/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Template
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Templates</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {templates.length - publishedCount} in draft
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.85</div>
            <p className="text-xs text-muted-foreground mt-1">
              From 213 reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Templates Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Templates</CardTitle>
              <CardDescription>
                Manage and monitor your template listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.title}</TableCell>
                      <TableCell>
                        <Badge variant={template.status === "Published" ? "default" : "secondary"}>
                          {template.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          {template.views}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{template.sales}</TableCell>
                      <TableCell className="text-right font-medium">{template.revenue}</TableCell>
                      <TableCell className="text-right">{template.rating || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/marketplace/edit/${template.id}`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="published">
          <Card>
            <CardHeader>
              <CardTitle>Published Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {publishedCount} published templates
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draft">
          <Card>
            <CardHeader>
              <CardTitle>Draft Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {templates.length - publishedCount} draft templates
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplaceCreator;
