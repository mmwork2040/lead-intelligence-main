import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Tag } from "lucide-react";
import { useTags } from "@/hooks/useTags";

interface TagSelectorProps {
  detectedTags: { name: string; count: number }[];
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
  newTags: string[];
  onNewTagsChange: (tags: string[]) => void;
}

export const TagSelector = ({
  detectedTags,
  selectedTags,
  onSelectedTagsChange,
  newTags,
  onNewTagsChange,
}: TagSelectorProps) => {
  const { data: existingTags = [] } = useTags();
  const [newTagInput, setNewTagInput] = useState("");

  const handleToggleDetectedTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onSelectedTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onSelectedTagsChange([...selectedTags, tagName]);
    }
  };

  const handleAddNewTag = () => {
    if (!newTagInput.trim()) return;
    
    const normalized = newTagInput.trim().toLowerCase();
    
    // Verifica se já existe
    if (newTags.includes(normalized) || selectedTags.includes(normalized)) {
      return;
    }
    
    onNewTagsChange([...newTags, normalized]);
    setNewTagInput("");
  };

  const handleRemoveNewTag = (tag: string) => {
    onNewTagsChange(newTags.filter((t) => t !== tag));
  };

  const handleToggleExistingTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onSelectedTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onSelectedTagsChange([...selectedTags, tagName]);
    }
  };

  const handleSelectAllDetected = () => {
    const allDetectedNames = detectedTags.map((t) => t.name);
    onSelectedTagsChange([...new Set([...selectedTags, ...allDetectedNames])]);
  };

  const handleDeselectAllDetected = () => {
    const detectedNames = new Set(detectedTags.map((t) => t.name));
    onSelectedTagsChange(selectedTags.filter((t) => !detectedNames.has(t)));
  };

  return (
    <div className="space-y-6">
      {/* Tags detectadas no arquivo */}
      {detectedTags.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags encontradas no arquivo ({detectedTags.length})
            </h3>
            <div className="flex gap-2">
              <Button 
                type="button"
                size="sm" 
                variant="outline" 
                onClick={handleSelectAllDetected}
              >
                Selecionar Todas
              </Button>
              <Button 
                type="button"
                size="sm" 
                variant="ghost" 
                onClick={handleDeselectAllDetected}
              >
                Desmarcar Todas
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {detectedTags.map((tag) => (
              <div
                key={tag.name}
                className="flex items-center space-x-2 p-3 rounded-lg border bg-card"
              >
                <Checkbox
                  checked={selectedTags.includes(tag.name)}
                  onCheckedChange={() => handleToggleDetectedTag(tag.name)}
                />
                <div className="flex-1">
                  <Badge variant="secondary">{tag.name}</Badge>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({tag.count} leads)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adicionar novas tags */}
      <div>
        <h3 className="text-sm font-medium mb-3">
          Adicionar tags a todos os leads importados
        </h3>
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Nome da tag..."
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddNewTag();
              }
            }}
          />
          <Button onClick={handleAddNewTag} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>
        {newTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {newTags.map((tag) => (
              <Badge
                key={tag}
                variant="default"
                className="cursor-pointer"
                onClick={() => handleRemoveNewTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Tags já existentes no sistema */}
      {existingTags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">
            Tags já existentes no sistema
          </h3>
          <div className="flex flex-wrap gap-2">
            {existingTags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleToggleExistingTag(tag.name)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
