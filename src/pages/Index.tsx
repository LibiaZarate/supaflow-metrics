import { useState } from "react";
import { LinkedInKPIDashboard } from "@/components/LinkedInKPIDashboard";
import { EmailKPIDashboard } from "@/components/EmailKPIDashboard";
import { DashboardSidebar } from "@/components/DashboardSidebar";

const Index = () => {
  const [selectedDashboard, setSelectedDashboard] = useState<"linkedin" | "email">("linkedin");

  const renderDashboard = () => {
    switch (selectedDashboard) {
      case "linkedin":
        return <LinkedInKPIDashboard />;
      case "email":
        return <EmailKPIDashboard />;
      default:
        return <LinkedInKPIDashboard />;
    }
  };

  return (
    <div className="flex h-screen">
      <DashboardSidebar 
        selectedDashboard={selectedDashboard}
        onDashboardChange={setSelectedDashboard}
      />
      <div className="flex-1 overflow-auto">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Index;
