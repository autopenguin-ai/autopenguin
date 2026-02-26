import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, ExternalLink, FileText, CheckCircle2, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// Mock data
const mockPurchases = [
  {
    id: "1",
    templateId: "1",
    title: "Lead Scoring Automation",
    platform: "n8n",
    purchaseDate: "2024-01-15",
    price: "$49",
    status: "Installed",
    creator: "John Doe"
  },
  {
    id: "2",
    templateId: "2",
    title: "Social Media Scheduler",
    platform: "Make",
    purchaseDate: "2024-01-20",
    price: "$39",
    status: "Downloaded",
    creator: "Jane Smith"
  },
  {
    id: "3",
    templateId: "3",
    title: "Customer Support Bot",
    platform: "Zapier",
    purchaseDate: "2024-01-25",
    price: "$79",
    status: "Pending",
    creator: "Mike Johnson"
  }
];

const MarketplacePurchases = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [purchases] = useState(mockPurchases);

  const totalSpent = purchases.reduce((acc, p) => {
    const price = parseFloat(p.price.replace(/[$,]/g, ''));
    return acc + price;
  }, 0);

  const installedCount = purchases.filter(p => p.status === "Installed").length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Purchases</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your purchased templates
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Templates owned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Installed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{installedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Purchases Tabs */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">My Templates</TabsTrigger>
          <TabsTrigger value="history">Purchase History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{purchase.platform}</Badge>
                    <Badge 
                      variant={
                        purchase.status === "Installed" ? "default" :
                        purchase.status === "Downloaded" ? "secondary" :
                        "outline"
                      }
                    >
                      {purchase.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{purchase.title}</CardTitle>
                  <CardDescription>by {purchase.creator}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchased</span>
                      <span>{new Date(purchase.purchaseDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-medium">{purchase.price}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  {purchase.status === "Installed" ? (
                    <Button variant="outline" className="flex-1" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                  ) : (
                    <Button className="flex-1" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Install
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/marketplace/template/${purchase.templateId}`)}
                  >
                    Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>
                Complete record of all your template purchases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{purchase.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{purchase.platform}</Badge>
                      </TableCell>
                      <TableCell>{purchase.creator}</TableCell>
                      <TableCell className="text-right font-medium">{purchase.price}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            purchase.status === "Installed" ? "default" :
                            purchase.status === "Downloaded" ? "secondary" :
                            "outline"
                          }
                        >
                          {purchase.status === "Installed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {purchase.status === "Pending" && <Clock className="h-3 w-3 mr-1" />}
                          {purchase.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketplacePurchases;
