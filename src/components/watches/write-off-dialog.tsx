"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { DateInput, isoDate } from "@/components/ui/date-input";
import { useToast } from "@/components/ui/toast";
import { apiPut } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";

interface WriteOffDialogProps {
  open: boolean;
  onClose: () => void;
  watch: {
    id: number;
    brand: string;
    model: string;
    status: string;
    writtenOffDate?: string | null;
    writtenOffReason?: string | null;
  };
  /** Purchase + parts: the amount that becomes a loss. */
  costBasis: number;
  onSaved: () => void;
}

/** "Write off": the watch is broken beyond repair, so its cost counts as a loss on this date. */
export function WriteOffDialog({ open, onClose, watch, costBasis, onSaved }: WriteOffDialogProps) {
  const { toast } = useToast();
  const editing = watch.status === "Written off";

  const [date, setDate] = useState(isoDate());
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const openKey = open ? `open:${watch.id}` : "closed";
  const [lastKey, setLastKey] = useState(openKey);
  if (openKey !== lastKey) {
    setLastKey(openKey);
    if (open) {
      setDate(watch.writtenOffDate ?? isoDate());
      setReason(watch.writtenOffReason ?? "");
    }
  }

  const save = async () => {
    setSaving(true);
    try {
      await apiPut(`/api/watches/${watch.id}`, {
        status: "Written off",
        writtenOffDate: date,
        writtenOffReason: reason.trim() || null,
      });
      toast(editing ? "Write-off updated" : `${watch.brand} ${watch.model} written off`, "success");
      onSaved();
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't write off the watch", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit write-off" : "Write off watch"}
      description="For a watch that's broken beyond repair. It leaves stock and its cost counts as a loss."
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex flex-col gap-4"
      >
        <DateInput label="Written off on" value={date} onValueChange={setDate} quickPicks={false} />
        <Textarea
          label="What happened"
          markOptional
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Cracked balance staff, no replacement parts…"
          maxLength={500}
        />

        <dl className="flex items-baseline justify-between rounded-lg bg-secondary/60 p-4 text-sm tabular-nums">
          <dt className="font-medium">
            Loss
            <span className="block text-xs font-normal text-muted-foreground">Purchase cost plus parts</span>
          </dt>
          <dd className="font-semibold text-critical-ink">{formatCurrency(-costBasis)}</dd>
        </dl>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : editing ? "Save" : "Write off"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
