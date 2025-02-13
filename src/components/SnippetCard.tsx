interface SnippetCardProps {
  title: string;
  description: string;
}

export default function SnippetCard({ title, description }: SnippetCardProps) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex gap-6">
        <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-4">{description}</p>
          <button className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 hover:bg-gray-300 transition-colors">
            Button
          </button>
        </div>
      </div>
    </div>
  );
} 