import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="flex flex-col justify-center px-4 py-4">
      <div className="max-w-md w-full mx-auto space-y-4">
        {/* Main Title */}
        <section className="text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            بيانات الأسر في مخيم شهد
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            هذا النظام مخصص لتسجيل وتنظيم بيانات الأسر،<br />
            للأطفال، والحوامل، والمرضعات في مخيم شهد.
          </p>
        </section>

        {/* Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <Link href="/register">
            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white py-4 text-sm sm:text-base h-auto">
              <Plus className="w-4 h-4 ml-2" />
              تسجيل أسرة جديدة
            </Button>
          </Link>

          <Link href="/lookup">
            <Button size="lg" variant="outline" className="w-full py-4 text-sm sm:text-base h-auto">
              <Search className="w-4 h-4 ml-2" />
              بحث بيانات
            </Button>
          </Link>
        </div>

        {/* Reassurance text */}
        <p className="text-center text-xs text-gray-500 pt-1">
          جميع البيانات تُستخدم لأغراض تنظيمية فقط.
        </p>
      </div>
    </div>
  );
}
