import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import Segments from "@/pages/Segments";
import SegmentDetail from "@/pages/SegmentDetail";
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import Analytics from "@/pages/Analytics";
import { CopilotProvider } from "@/copilot/CopilotContext";

export default function App() {
  return (
    <BrowserRouter>
      <CopilotProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="segments" element={<Segments />} />
            <Route path="segments/:id" element={<SegmentDetail />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="campaigns/:id" element={<CampaignDetail />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </CopilotProvider>
    </BrowserRouter>
  );
}
