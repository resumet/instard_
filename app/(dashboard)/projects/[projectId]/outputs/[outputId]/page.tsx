import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { demoGeneratedReel } from "@/lib/demo-data";

export default function OutputPage() {
  const result = demoGeneratedReel;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-primary">{result.target_duration_seconds}초 릴스</p>
        <h1 className="text-3xl font-bold">{result.title}</h1>
        <p className="mt-2 text-muted-foreground">{result.disclaimer}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{result.hook}</CardTitle>
        </CardHeader>
        <p className="whitespace-pre-line leading-7">{result.full_script}</p>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-2">시간</th>
              <th>화면</th>
              <th>대사</th>
              <th>자막</th>
              <th>편집</th>
            </tr>
          </thead>
          <tbody>
            {result.scene_lines.map((scene) => (
              <tr key={scene.time} className="border-t align-top">
                <td className="py-3">{scene.time}</td>
                <td>{scene.visual}</td>
                <td>{scene.dialogue}</td>
                <td>{scene.caption}</td>
                <td>{scene.edit_point}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
