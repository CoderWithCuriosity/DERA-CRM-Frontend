export const helpContent = {
  contacts: {
    title: "👥 Contacts Management",
    description: "Contacts are the heart of your CRM - they store all information about the people and companies you interact with.",
    whyUse: [
      "Keep all customer information in one centralized location",
      "Never lose contact details or interaction history",
      "Track communication preferences and history",
      "Segment contacts for targeted marketing",
      "Build long-term relationships with complete customer profiles"
    ],
    whenToUse: [
      "Adding a new lead from a website form → Create contact",
      "Meeting someone at a networking event → Add them as contact",
      "Customer calls for support → Look up their contact record",
      "Planning a marketing campaign → Filter contacts by tags or status",
      "Handing off a lead to another team member → Share contact record"
    ],
    examples: [
      "📇 New Lead: 'John from Tech Corp downloaded our whitepaper - create contact with lead status'",
      "🏢 Existing Customer: 'Sarah at ABC Inc - has active deal, add notes from today's call'",
      "🎯 Target Account: 'Microsoft - create contact for each decision maker we meet'",
      "🤝 Partner: 'Jane from Partner Company - tag as partner, track collaboration history'"
    ],
    tips: [
      "Always fill in key fields (email, phone, company) when creating contacts",
      "Use tags liberally but consistently for easy filtering",
      "Add notes after every interaction - they're invaluable later",
      "Keep contact data clean by updating outdated information",
      "Set up required fields to ensure data completeness"
    ]
  },

  source: {
    title: "📱 Contact Source",
    description: "Source indicates where or how this contact was first discovered or added to your system - helping you track your best lead generation channels.",
    whyUse: [
      "Track which marketing channels generate the most leads",
      "Measure ROI of different acquisition methods",
      "Understand your best sources of customers",
      "Optimize marketing spend based on source performance",
      "Identify which partnerships or referrals bring quality leads"
    ],
    whenToUse: [
      "When adding a contact from a website form → Select 'Website'",
      "When a customer refers someone → Select 'Referral'",
      "When manually adding a contact from a networking event → Select 'Manual'",
      "When importing from another system → Select 'Import'",
      "When a contact comes from social media → Select 'Social'"
    ],
    examples: [
      "🌐 Website: 'Contact filled out demo request form on product page'",
      "📧 Email: 'Replied to marketing campaign about new feature'",
      "🤝 Referral: 'Recommended by existing customer Jane Smith'",
      "📱 Social: 'Found us through LinkedIn post about CRM'",
      "📞 Call: 'Called after seeing billboard advertisement'"
    ],
    tips: [
      "Always record the source for new contacts - it's free marketing intelligence",
      "Use source data to identify which channels deserve more budget",
      "Track source alongside conversion rates to see quality vs quantity",
      "Create saved reports comparing sources to spot trends",
      "Review source performance quarterly to adjust marketing strategy"
    ]
  },

  tags: {
    title: "🎯 Understanding Tags",
    description: "Tags are like color-coded sticky notes that help you organize and filter your contacts quickly.",
    whyUse: [
      "Quickly filter and find specific groups of contacts",
      "Track special characteristics (like 'VIP', 'Budget Conscious', 'Technical Decision Maker')",
      "Create targeted email campaigns based on tags",
      "Automate workflows (e.g., send welcome email to 'New Customer' tag)",
      "Measure performance of different customer segments"
    ],
    whenToUse: [
      "When a contact has special requirements or preferences",
      "To group contacts by industry, interest, or behavior",
      "When you want to run targeted marketing campaigns",
      "To track where the lead came from (e.g., 'Website', 'Referral', 'Trade Show')",
      "When you need to prioritize certain contacts (e.g., 'Hot Lead', 'Follow Up')"
    ],
    examples: [
      "Add 'VIP' tag to your top 20% customers who generate most revenue",
      "Tag contacts as 'Interested in Product A' after a demo to send them product updates",
      "Use 'Needs Follow-up' tag to track contacts you need to call back",
      "Tag by industry: 'Healthcare', 'Tech', 'Education' to send industry-specific content"
    ],
    tips: [
      "Don't create too many tags - stick to 10-15 meaningful categories",
      "Use consistent naming (e.g., always use 'Hot Lead' not sometimes 'Hot' and sometimes 'Hot Lead')",
      "Combine tags for powerful segmentation (e.g., 'VIP' + 'Tech Industry')",
      "Review and clean up unused tags monthly"
    ]
  },

  status: {
    title: "📊 Contact Status",
    description: "Status shows where each contact is in your customer journey, from initial interest to long-term relationship.",
    whyUse: [
      "Quickly see which contacts are active vs. inactive",
      "Focus your sales efforts on leads that need attention",
      "Track your conversion rates at each stage",
      "Clean up inactive contacts to maintain accurate data",
      "Automate workflows based on status changes"
    ],
    whenToUse: [
      "When a new person shows interest → mark as 'Lead'",
      "When they become a paying customer → change to 'Active'",
      "If they haven't engaged in 6 months → mark as 'Inactive'",
      "When doing sales follow-ups, focus on 'Leads' first"
    ],
    examples: [
      "A website visitor downloads your ebook → Create as 'Lead'",
      "After they purchase your software → Change to 'Active'",
      "Customer hasn't logged in for 1 year → Move to 'Inactive'",
      "Former customer returns → Reactivate to 'Active' status"
    ],
    tips: [
      "Set up automation to move leads to inactive after 90 days of no engagement",
      "Create saved filters for each status to quickly access your lists",
      "Track how long it takes leads to become active customers",
      "Regularly review inactive contacts for reactivation campaigns"
    ]
  },

  activities: {
    title: "📅 Activities & Tasks",
    description: "Activities are all the interactions you have with contacts - calls, emails, meetings, and tasks.",
    whyUse: [
      "Never forget to follow up with important contacts",
      "Keep a complete history of all customer interactions",
      "Coordinate team efforts on the same contact",
      "Measure response times and activity levels",
      "Plan your daily and weekly work schedule"
    ],
    whenToUse: [
      "After a sales call → Log it as an activity",
      "When you promise to call back next week → Create a follow-up task",
      "Before a client meeting → Schedule it with all attendees",
      "When sending important documents → Log it for reference"
    ],
    examples: [
      "📞 Call: 'Discussed pricing with John, promised to send quote by Friday'",
      "📧 Email: 'Sent product brochure to technical team'",
      "🤝 Meeting: 'Product demo with ABC Corp at 2 PM next Tuesday'",
      "✅ Task: 'Prepare quarterly report for Sarah by end of month'"
    ],
    tips: [
      "Always set reminders for important follow-ups",
      "Add notes to activities - they're valuable context later",
      "Use activity types consistently for better reporting",
      "Complete activities when done to keep your list clean"
    ]
  },

  deals: {
    title: "💼 Deals & Sales Pipeline",
    description: "Deals track potential revenue from first contact to closed sale, showing exactly where each opportunity stands.",
    whyUse: [
      "Know exactly how much revenue is in your pipeline",
      "Focus on deals most likely to close",
      "Identify bottlenecks in your sales process",
      "Forecast future revenue accurately",
      "Track which sales strategies work best"
    ],
    whenToUse: [
      "When a lead shows buying interest → Create a deal",
      "After sending a quote → Move to 'Proposal' stage",
      "When discussing terms → Move to 'Negotiation'",
      "Customer agrees to buy → Move to 'Won'"
    ],
    examples: [
      "🟢 Lead: 'Downloaded pricing guide, interested in annual plan'",
      "🟡 Qualified: 'Has budget of $10k, decision maker, needs by Q3'",
      "🔵 Proposal: 'Sent contract and detailed quote on Monday'",
      "✅ Won: 'Signed contract, payment received! 🎉'"
    ],
    tips: [
      "Update deal stages immediately when something changes",
      "Add notes at each stage - why they moved forward or stalled",
      "Don't keep dead deals open - mark them as 'Lost' to learn from them",
      "Set expected close dates and review overdue deals weekly"
    ]
  },

  tickets: {
    title: "🎫 Support Tickets",
    description: "Tickets track customer issues, questions, and support requests from submission to resolution.",
    whyUse: [
      "Never lose track of customer problems",
      "Ensure every issue gets resolved",
      "Measure response and resolution times",
      "Identify recurring issues to fix permanently",
      "Keep customers happy with fast support"
    ],
    whenToUse: [
      "Customer reports a bug → Create ticket",
      "Client asks a question → Create ticket",
      "User requests new feature → Create ticket",
      "Billing inquiry → Create ticket"
    ],
    examples: [
      "🔴 Urgent: 'Can't log in, system down, losing sales!'",
      "🟡 High: 'Payment processing error on checkout'",
      "🟢 Low: 'How do I export reports?'",
      "⚡ SLA Breach: 'Customer waiting 4 hours for response (promised 2 hours)'"
    ],
    tips: [
      "Set priority based on business impact, not customer tone",
      "Use canned responses for common questions",
      "Tag tickets by category for better reporting",
      "Always follow up after resolution to ensure customer satisfaction"
    ]
  },

  campaigns: {
    title: "📧 Email Campaigns",
    description: "Campaigns let you send marketing emails to multiple contacts at once, track opens and clicks.",
    whyUse: [
      "Reach many customers at once efficiently",
      "Track who opens and clicks your emails",
      "Automate follow-ups based on engagement",
      "Measure marketing ROI",
      "Nurture leads with targeted content"
    ],
    whenToUse: [
      "Launching a new product → Send announcement",
      "Monthly newsletter → Send updates",
      "Birthday greetings → Automated campaigns",
      "Re-engaging inactive users → Win-back campaign"
    ],
    examples: [
      "📢 New Feature: 'Introducing our new mobile app - try it now!'",
      "🎉 Promotion: 'Black Friday Sale - 30% off for loyal customers'",
      "📚 Educational: '5 tips to get more from your subscription'",
      "👋 Welcome: 'Thanks for signing up! Here's how to get started'"
    ],
    tips: [
      "Segment your audience for better results (e.g., active vs. inactive)",
      "Test subject lines with small groups first",
      "Send at optimal times (Tues-Thurs, 10am-2pm usually best)",
      "Track and learn from unsubscribe reasons"
    ]
  },

  sla: {
    title: "⏰ SLA (Service Level Agreement)",
    description: "SLAs are promises about how fast you'll respond to customers. The system warns you before you break these promises.",
    whyUse: [
      "Keep customers happy with fast responses",
      "Meet contractual obligations",
      "Prioritize work effectively",
      "Identify when you need more staff",
      "Build trust with customers"
    ],
    whenToUse: [
      "Setting customer support standards",
      "Tracking team performance",
      "Managing urgent issues",
      "Reporting on service quality"
    ],
    examples: [
      "⚡ Urgent issues: Respond within 1 hour → System alerts at 45 minutes",
      "🟡 High priority: Respond within 4 hours → Warning at 3 hours",
      "🟢 Normal: Respond within 24 hours → Warning at 20 hours",
      "⚠️ Breach: Response time exceeded → Manager gets alert"
    ],
    tips: [
      "Set realistic times you can consistently meet",
      "Different priorities = different response times",
      "Review SLA performance monthly",
      "Celebrate when you beat your SLAs!"
    ]
  },

  auditLogs: {
    title: "📋 Audit Logs",
    description: "Audit logs track every change made in the system - who did what and when.",
    whyUse: [
      "Track who changed important data",
      "Investigate issues or mistakes",
      "Meet compliance requirements",
      "Prevent unauthorized changes",
      "Train new team members"
    ],
    whenToUse: [
      "Customer says 'I was promised different pricing' → Check who promised",
      "Data suddenly changed → Find out who changed it",
      "Security audit → Review all access",
      "Onboarding new team → Show them what happened"
    ],
    examples: [
      "👤 John changed deal amount from $10k to $15k at 2:30 PM",
      "📧 Sarah deleted important contact - restored from log",
      "💰 Mike moved deal from 'Proposal' to 'Won' yesterday",
      "🔐 Admin changed user permissions for new manager"
    ],
    tips: [
      "Check logs regularly for unusual activity",
      "Use logs to identify training needs",
      "Keep logs for at least 1 year for compliance",
      "Review before making system changes"
    ]
  }
};

// Optional: Create a type for better TypeScript support
export type HelpTopic = keyof typeof helpContent;

export interface HelpContent {
  title: string;
  description: string;
  whyUse: string[];
  whenToUse: string[];
  examples: string[];
  tips?: string[];
}