import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Square, Clock, AlertTriangle } from "lucide-react";

export default function Features() {
  const features = [
    {
      category: "Infrastructure & Deployment",
      status: "completed",
      items: [
        { name: "Server Deployment (Ubuntu + BT-Panel)", status: "done" },
        { name: "Apache Reverse Proxy", status: "done" },
        { name: "SSL Configuration", status: "done" },
        { name: "Node.js Backend (PM2)", status: "done" },
        { name: "Frontend Static Deployment", status: "done" }
      ]
    },
    {
      category: "Authentication System",
      status: "completed",
      items: [
        { name: "Login Page Design", status: "done" },
        { name: "Backend Login API", status: "done" },
        { name: "JWT Token Generation", status: "done" },
        { name: "Token Storage & Validation", status: "done" },
        { name: "Redirect Logic Fix", status: "done" },
        { name: "Logout Functionality", status: "done" }
      ]
    },
    {
      category: "Reservation Management",
      status: "pending",
      items: [
        { name: "Reservation List (Timeline View)", status: "todo" },
        { name: "Reservation List (Mobile View)", status: "todo" },
        { name: "Create Reservation", status: "todo" },
        { name: "Edit/Delete Reservation", status: "todo" },
        { name: "Conflict Detection Algorithm", status: "todo" },
        { name: "Search & Filter", status: "todo" }
      ]
    },
    {
      category: "Table Management",
      status: "pending",
      items: [
        { name: "Table List View", status: "todo" },
        { name: "Create/Edit Tables", status: "todo" },
        { name: "Table Capacity Settings", status: "todo" },
        { name: "Availability Status", status: "todo" }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <div className="border-b-2 border-border pb-6">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Feature Matrix</h1>
        <p className="text-muted-foreground font-mono mt-2">TRACKING_MODULES // V.1.0</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((category, idx) => (
          <Card key={idx} className="neo-box rounded-none">
            <CardHeader className="border-b-2 border-border pb-3 bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="font-black text-lg uppercase">
                {category.category}
              </CardTitle>
              <StatusBadge status={category.status} />
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {category.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                    <div className="mt-0.5">
                      <ItemIcon status={item.status} />
                    </div>
                    <span className={`font-mono text-sm ${item.status === 'done' ? 'line-through text-muted-foreground decoration-2' : ''}`}>
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return <Badge className="bg-green-600 text-white hover:bg-green-700 border-2 border-black rounded-none">COMPLETED</Badge>;
  }
  if (status === "pending") {
    return <Badge className="bg-yellow-400 text-black hover:bg-yellow-500 border-2 border-black rounded-none">PENDING</Badge>;
  }
  return <Badge variant="outline" className="rounded-none border-2 border-black">UNKNOWN</Badge>;
}

function ItemIcon({ status }: { status: string }) {
  if (status === "done") return <CheckSquare className="w-5 h-5 text-green-600" />;
  if (status === "in-progress") return <Clock className="w-5 h-5 text-blue-600" />;
  return <Square className="w-5 h-5 text-muted-foreground" />;
}
