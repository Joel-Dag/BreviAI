"use client";

import { useState } from "react";
import { Check, Edit3, Trash2, Plus, Calendar, User, X, CheckSquare } from "lucide-react";

export interface ActionItemData {
  id: string;
  meeting_id?: string;
  description?: string;
  task?: string;
  owner_name?: string | null;
  assignee?: string | null;
  due_date?: string | null;
  is_completed?: boolean;
}

interface ActionItemsListProps {
  meetingId: string;
  initialItems: ActionItemData[];
}

export function ActionItemsList({ meetingId, initialItems }: ActionItemsListProps) {
  const [items, setItems] = useState<ActionItemData[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editDate, setEditDate] = useState("");

  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [newDate, setNewDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle completion
  const handleToggle = async (item: ActionItemData) => {
    const nextCompleted = !item.is_completed;
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_completed: nextCompleted } : i))
    );

    try {
      await fetch(`/api/meetings/${meetingId}/action-items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          is_completed: nextCompleted,
        }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Start editing an item
  const handleStartEdit = (item: ActionItemData) => {
    setEditingId(item.id);
    setEditText(item.description || item.task || "");
    setEditOwner(item.owner_name || item.assignee || "");
    setEditDate(item.due_date || "");
  };

  // Save item edits
  const handleSaveEdit = async (itemId: string) => {
    if (!editText.trim()) return;

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              description: editText.trim(),
              task: editText.trim(),
              owner_name: editOwner.trim() || null,
              assignee: editOwner.trim() || null,
              due_date: editDate || null,
            }
          : i
      )
    );
    setEditingId(null);

    try {
      await fetch(`/api/meetings/${meetingId}/action-items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          description: editText.trim(),
          owner_name: editOwner.trim() || null,
          due_date: editDate || null,
        }),
      });
    } catch (err) {
      console.error("Failed to save edit:", err);
    }
  };

  // Delete an item
  const handleDelete = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await fetch(`/api/meetings/${meetingId}/action-items?itemId=${itemId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  // Add new item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/action-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: newText.trim(),
          owner_name: newOwner.trim() || null,
          due_date: newDate || null,
        }),
      });

      const data = await res.json();
      if (data.item) {
        setItems((prev) => [...prev, data.item]);
      } else {
        setItems((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            description: newText.trim(),
            owner_name: newOwner.trim() || null,
            due_date: newDate || null,
            is_completed: false,
          },
        ]);
      }

      setNewText("");
      setNewOwner("");
      setNewDate("");
      setIsAdding(false);
    } catch (err) {
      console.error("Failed to add action item:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section className="rounded-2xl border border-[#E6D7C7] bg-[#FFFFFF] p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[#E6D7C7]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F6EEE5] text-[#B85414]">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#22150E]">Action Items & Tasks</h2>
            <p className="text-xs text-[#8A7264]">
              {totalCount === 0
                ? "No tasks assigned yet"
                : `${completedCount} of ${totalCount} completed (${percentage}%)`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#F6EEE5] px-3 py-1.5 text-xs font-semibold text-[#8A4315] hover:bg-[#ECDCCB] border border-[#E6D7C7] transition-colors"
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isAdding ? "Cancel" : "Add Task"}
        </button>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-[#F6EEE5] h-2 rounded-full overflow-hidden mb-5">
          <div
            className="bg-[#B85414] h-full transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Add Item Form */}
      {isAdding && (
        <form
          onSubmit={handleAddItem}
          className="mb-5 p-4 rounded-xl border border-[#E6D7C7] bg-[#FAF6F0] space-y-3"
        >
          <input
            type="text"
            placeholder="Task description..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            required
            className="w-full rounded-lg border border-[#E6D7C7] bg-[#FFFFFF] px-3 py-2 text-sm text-[#22150E] focus:outline-none focus:ring-2 focus:ring-[#B85414]"
            autoFocus
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-[#8A7264]" />
              <input
                type="text"
                placeholder="Assignee (e.g. Sarah)"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E6D7C7] bg-[#FFFFFF] text-xs text-[#22150E] focus:outline-none focus:ring-2 focus:ring-[#B85414]"
              />
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-[#8A7264]" />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E6D7C7] bg-[#FFFFFF] text-xs text-[#22150E] focus:outline-none focus:ring-2 focus:ring-[#B85414]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#6E584C] hover:bg-[#F6EEE5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newText.trim()}
              className="px-4 py-1.5 rounded-lg bg-[#B85414] hover:bg-[#9C430C] text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Adding..." : "Save Task"}
            </button>
          </div>
        </form>
      )}

      {/* Action Items List */}
      <div className="divide-y divide-[#F0E4D6]">
        {items.map((item) => {
          const taskDescription = item.description || item.task || "Action item";
          const assigneeName = item.owner_name || item.assignee;
          const isEditMode = editingId === item.id;

          if (isEditMode) {
            return (
              <div key={item.id} className="py-3 space-y-2.5 bg-[#FAF6F0] p-3 rounded-xl my-1 border border-[#E6D7C7]">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full rounded-lg border border-[#E6D7C7] bg-[#FFFFFF] px-3 py-1.5 text-sm text-[#22150E] focus:outline-none focus:ring-2 focus:ring-[#B85414]"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Assignee"
                    value={editOwner}
                    onChange={(e) => setEditOwner(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E6D7C7] bg-[#FFFFFF] text-xs text-[#22150E]"
                  />
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E6D7C7] bg-[#FFFFFF] text-xs text-[#22150E]"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 rounded text-xs font-medium text-[#6E584C]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(item.id)}
                    className="px-3 py-1 rounded bg-[#B85414] text-white text-xs font-semibold shadow-sm hover:bg-[#9C430C]"
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className={`py-3.5 flex items-start justify-between gap-3 group transition-colors ${
                item.is_completed ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    item.is_completed
                      ? "bg-[#B85414] border-[#B85414] text-white"
                      : "border-[#D4C0AE] bg-[#FFFFFF] hover:border-[#B85414]"
                  }`}
                  title={item.is_completed ? "Mark as uncompleted" : "Mark as completed"}
                >
                  {item.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      item.is_completed
                        ? "line-through text-[#8A7264]"
                        : "text-[#22150E]"
                    }`}
                  >
                    {taskDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#8A7264]">
                    {assigneeName && (
                      <span className="inline-flex items-center gap-1 bg-[#F6EEE5] text-[#8A4315] px-2 py-0.5 rounded font-medium">
                        <User className="w-3 h-3" />
                        {assigneeName}
                      </span>
                    )}
                    {item.due_date && (
                      <span className="inline-flex items-center gap-1 bg-[#FAF6F0] border border-[#E6D7C7] text-[#6E584C] px-2 py-0.5 rounded">
                        <Calendar className="w-3 h-3" />
                        Due: {item.due_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons on hover */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleStartEdit(item)}
                  className="p-1.5 text-[#8A7264] hover:text-[#22150E] hover:bg-[#F6EEE5] rounded-md transition-colors"
                  title="Edit task"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-[#8A7264] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {items.length === 0 && !isAdding && (
          <div className="py-6 text-center text-xs text-[#8A7264] italic">
            No action items identified for this meeting. Click &quot;Add Task&quot; above to create one.
          </div>
        )}
      </div>
    </section>
  );
}
