import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbItem } from "@/types";

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500 overflow-x-auto whitespace-nowrap pb-1">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="hover:text-blue-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? "text-gray-900 font-medium" : ""}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
