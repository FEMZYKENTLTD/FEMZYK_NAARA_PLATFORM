// app/(dashboard)/learn/page.tsx
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'MicroSkill Labs — FEMZYK NÀÁRA',
  description: 'Free and downloadable courses for skill building.',
};

const CATEGORY_COLORS = {
  trade: 'bg-blue-100 text-blue-700',
  soft_skill: 'bg-purple-100 text-purple-700',
  digital: 'bg-green-100 text-green-700',
};

export default async function LearnPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from('courses')
    .select(`*, instructor:users!courses_created_by_fkey(full_name)`)
    .eq('approved', true)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">MicroSkill Labs</h1>
        <p className="text-slate-500 mt-1">Free courses to build your skills — available offline</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses && courses.length > 0 ? courses.map((course) => {
          const instructor = course.instructor as { full_name: string } | null;
          return (
            <Card key={course.course_id} className="p-5 hover:shadow-md transition-shadow h-full">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                </div>
                {course.offline_pack && (
                  <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">
                    <Download className="h-3 w-3 mr-1" />Offline
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{course.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-3">{course.description}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1"><User className="h-3 w-3" />{instructor?.full_name || 'Unknown'}</span>
                <Badge className={`border-0 text-[10px] capitalize ${CATEGORY_COLORS[course.category as keyof typeof CATEGORY_COLORS] || ''}`}>
                  {course.category?.replace('_', ' ')}
                </Badge>
              </div>
            </Card>
          );
        }) : (
          <div className="col-span-full">
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900">No courses yet</h3>
              <p className="text-slate-500 mt-1">Courses will appear here once uploaded.</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}