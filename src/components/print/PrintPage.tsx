import { PrintPage, PrintConfig } from '@/lib/print/printTypes';

interface PrintPageProps {
  page: PrintPage;
  config: PrintConfig;
}

export function PrintPageComponent({ page, config }: PrintPageProps) {
  const { options } = config;
  const { margins } = options;

  return (
    <div
      className="print-page bg-white relative"
      style={{
        width: options.pageSize === 'a4' ? '210mm' : '8.5in',
        height: options.pageSize === 'a4' ? '297mm' : '11in',
        padding: `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`,
        pageBreakAfter: 'always',
        position: 'relative',
      }}
    >
      {/* Page Number */}
      {options.includePageNumbers && (
        <div className="absolute bottom-4 right-4 text-sm text-muted-foreground">
          {page.pageNumber}
        </div>
      )}

      {/* Page Content */}
      <div className={`print-page-content h-full ${page.layout}`}>
        {page.layout === 'grid' && (
          <div className="grid grid-cols-3 gap-4 h-full">
            {page.content.map((item, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden bg-accent/50">
                {item.type === 'photo' && (
                  <img
                    src={item.data.url}
                    alt={item.data.caption || ''}
                    className="w-full h-full object-cover"
                  />
                )}
                {item.type === 'story' && (
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">{item.data.title}</h3>
                    <p className="text-sm line-clamp-6">{item.data.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {page.layout === 'full' && page.content[0] && (
          <div className="h-full flex flex-col">
            {page.content[0].type === 'photo' && (
              <img
                src={page.content[0].data.url}
                alt={page.content[0].data.caption || ''}
                className="w-full h-full object-contain"
              />
            )}
            {page.content[0].type === 'story' && (
              <div className="p-8">
                <h2 className="text-3xl font-bold mb-4">{page.content[0].data.title}</h2>
                <div className="prose max-w-none">
                  {page.content[0].data.content}
                </div>
              </div>
            )}
          </div>
        )}

        {page.layout === 'split' && (
          <div className="grid grid-rows-3 gap-4 h-full">
            {page.content.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                {item.data.image && (
                  <div className="w-1/3 rounded-lg overflow-hidden">
                    <img
                      src={item.data.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-semibold mb-2">{item.data.title}</h3>
                  <p className="text-sm">{item.data.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {page.layout === 'text' && (
          <div className="space-y-6">
            {page.content.map((item, idx) => (
              <div key={idx} className="border-l-4 border-primary pl-4">
                <div className="text-sm text-muted-foreground mb-1">
                  {item.data.date}
                </div>
                <h3 className="font-semibold mb-2">{item.data.title}</h3>
                <p className="text-sm">{item.data.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
