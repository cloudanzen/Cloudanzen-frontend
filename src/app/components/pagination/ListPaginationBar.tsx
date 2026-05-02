import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

interface ListPaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemLabel?: string;
  pageSizeOptions?: number[];
  className?: string;
}

export function ListPaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'result',
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  className = '',
}: ListPaginationBarProps) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const end = total === 0 ? 0 : Math.min(safePage * safePageSize, total);
  const label = total === 1 ? itemLabel : `${itemLabel}s`;
  const options = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pageSize].sort((a, b) => a - b);

  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-sm text-foreground">
        {start} to {end} of {total} {label}
      </p>
      <div className="flex items-center gap-3 self-end sm:self-auto">
        <span className="text-sm text-foreground">Show per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger className="h-9 w-24 bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end" className="min-w-24">
            {options.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex overflow-hidden rounded-md bg-muted/50">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-none"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-none"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
