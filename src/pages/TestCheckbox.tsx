
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export default function TestCheckbox() {
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);

  return (
    <div className="min-h-screen p-8 space-y-8 bg-background text-foreground">
      <h1 className="text-2xl font-bold">Checkbox Visibility Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Default variant</h2>
        <div className="flex items-center gap-4">
          <Checkbox checked={false} />
          <span>Unchecked</span>
        </div>
        <div className="flex items-center gap-4">
          <Checkbox checked={true} />
          <span>Checked</span>
        </div>
        <div className="flex items-center gap-4">
          <Checkbox checked="indeterminate" />
          <span>Indeterminate</span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Header variant</h2>
        <div className="flex items-center gap-4">
          <Checkbox variant="header" checked={false} />
          <span>Unchecked</span>
        </div>
        <div className="flex items-center gap-4">
          <Checkbox variant="header" checked={true} />
          <span>Checked</span>
        </div>
        <div className="flex items-center gap-4">
          <Checkbox variant="header" checked="indeterminate" />
          <span>Indeterminate</span>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Interactive header</h2>
        <div className="flex items-center gap-4">
          <Checkbox
            variant="header"
            checked={indeterminate ? "indeterminate" : checked}
            onCheckedChange={(value) => {
              if (value === "indeterminate") {
                setIndeterminate(true);
                setChecked(false);
              } else {
                setIndeterminate(false);
                setChecked(value as boolean);
              }
            }}
          />
          <span>Click me (cycle: unchecked → checked → indeterminate)</span>
        </div>
      </div>
    </div>
  );
}
