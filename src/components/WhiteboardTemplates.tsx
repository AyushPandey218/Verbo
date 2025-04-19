
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Grid2X2, Layout, Table2, MonitorSmartphone, StickyNote, Workflow, CalendarDays } from 'lucide-react';

interface TemplateProps {
  name: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const Template: React.FC<TemplateProps> = ({ name, icon, onClick }) => {
  return (
    <Card className="hover:border-violet-300 hover:bg-violet-50 transition-colors cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
        <div className="text-violet-600">{icon}</div>
        <p className="text-sm font-medium text-center">{name}</p>
      </CardContent>
    </Card>
  );
};

interface WhiteboardTemplatesProps {
  onSelectTemplate: (template: string, data: any) => void;
  onClose: () => void;
}

const WhiteboardTemplates: React.FC<WhiteboardTemplatesProps> = ({ onSelectTemplate, onClose }) => {
  const templates = [
    {
      name: "Blank Canvas",
      icon: <Grid2X2 size={24} />,
      data: { type: "blank" }
    },
    {
      name: "Meeting Notes",
      icon: <StickyNote size={24} />,
      data: { 
        type: "meeting",
        structure: [
          { type: "text", content: "Meeting Notes", style: "heading", position: { x: 50, y: 50 } },
          { type: "text", content: "Date: ", style: "subheading", position: { x: 50, y: 100 } },
          { type: "text", content: "Participants: ", style: "subheading", position: { x: 50, y: 150 } },
          { type: "text", content: "Agenda: ", style: "subheading", position: { x: 50, y: 200 } },
          { type: "text", content: "Action Items: ", style: "subheading", position: { x: 50, y: 400 } }
        ]
      }
    },
    {
      name: "Brainstorming",
      icon: <Workflow size={24} />,
      data: {
        type: "brainstorm",
        structure: [
          { type: "text", content: "Main Idea", style: "heading", position: { x: 400, y: 200 } },
          { type: "circle", position: { x: 400, y: 200 }, radius: 80 }
        ] 
      }
    },
    {
      name: "Kanban Board",
      icon: <Table2 size={24} />,
      data: {
        type: "kanban",
        columns: ["To Do", "In Progress", "Done"],
        structure: [
          { type: "rectangle", position: { x: 100, y: 100 }, width: 180, height: 400 },
          { type: "text", content: "To Do", style: "columnHeader", position: { x: 100, y: 120 } },
          { type: "rectangle", position: { x: 320, y: 100 }, width: 180, height: 400 },
          { type: "text", content: "In Progress", style: "columnHeader", position: { x: 320, y: 120 } },
          { type: "rectangle", position: { x: 540, y: 100 }, width: 180, height: 400 },
          { type: "text", content: "Done", style: "columnHeader", position: { x: 540, y: 120 } }
        ]
      }
    },
    {
      name: "Weekly Planner",
      icon: <CalendarDays size={24} />,
      data: {
        type: "planner",
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        structure: [
          // Will generate a grid structure in the implementation
        ]
      }
    },
    {
      name: "User Flow",
      icon: <MonitorSmartphone size={24} />,
      data: {
        type: "userflow",
        structure: [
          { type: "rectangle", position: { x: 100, y: 200 }, width: 120, height: 70 },
          { type: "text", content: "Start", style: "boxText", position: { x: 100, y: 200 } },
          { type: "arrow", start: { x: 220, y: 235 }, end: { x: 320, y: 235 } },
          { type: "rectangle", position: { x: 400, y: 200 }, width: 120, height: 70 },
          { type: "text", content: "Process", style: "boxText", position: { x: 400, y: 200 } },
          { type: "arrow", start: { x: 520, y: 235 }, end: { x: 620, y: 235 } },
          { type: "rectangle", position: { x: 700, y: 200 }, width: 120, height: 70 },
          { type: "text", content: "End", style: "boxText", position: { x: 700, y: 200 } }
        ]
      }
    },
    {
      name: "Grid Layout",
      icon: <Layout size={24} />,
      data: {
        type: "grid",
        gridSize: 20
      }
    }
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Choose a Template</h3>
      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Template 
              key={template.name} 
              name={template.name}
              icon={template.icon}
              onClick={() => onSelectTemplate(template.name, template.data)}
            />
          ))}
        </div>
      </ScrollArea>
      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
};

export default WhiteboardTemplates;
