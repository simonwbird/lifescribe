import { PrintContent, PrintPage, PrintLayout } from './printTypes';

export function paginateContent(
  content: PrintContent[],
  layout: PrintLayout,
  pageSize: { width: number; height: number }
): PrintPage[] {
  const pages: PrintPage[] = [];
  
  if (layout === 'yearbook') {
    return paginateYearbook(content, pageSize);
  } else if (layout === 'tribute') {
    return paginateTribute(content, pageSize);
  } else if (layout === 'portfolio') {
    return paginatePortfolio(content, pageSize);
  } else if (layout === 'timeline') {
    return paginateTimeline(content, pageSize);
  }
  
  return pages;
}

function paginateYearbook(content: PrintContent[], pageSize: { width: number; height: number }): PrintPage[] {
  const pages: PrintPage[] = [];
  const itemsPerPage = 6; // 2 rows x 3 columns grid
  
  for (let i = 0; i < content.length; i += itemsPerPage) {
    const pageContent = content.slice(i, i + itemsPerPage);
    pages.push({
      pageNumber: pages.length + 1,
      content: pageContent,
      layout: 'grid',
    });
  }
  
  return pages;
}

function paginateTribute(content: PrintContent[], pageSize: { width: number; height: number }): PrintPage[] {
  const pages: PrintPage[] = [];
  const itemsPerPage = 3; // Larger images, fewer per page
  
  for (let i = 0; i < content.length; i += itemsPerPage) {
    const pageContent = content.slice(i, i + itemsPerPage);
    pages.push({
      pageNumber: pages.length + 1,
      content: pageContent,
      layout: 'split',
    });
  }
  
  return pages;
}

function paginatePortfolio(content: PrintContent[], pageSize: { width: number; height: number }): PrintPage[] {
  const pages: PrintPage[] = [];
  
  // One item per page for portfolio layout
  content.forEach((item, index) => {
    pages.push({
      pageNumber: index + 1,
      content: [item],
      layout: 'full',
    });
  });
  
  return pages;
}

function paginateTimeline(content: PrintContent[], pageSize: { width: number; height: number }): PrintPage[] {
  const pages: PrintPage[] = [];
  const itemsPerPage = 4; // Timeline items
  
  for (let i = 0; i < content.length; i += itemsPerPage) {
    const pageContent = content.slice(i, i + itemsPerPage);
    pages.push({
      pageNumber: pages.length + 1,
      content: pageContent,
      layout: 'text',
    });
  }
  
  return pages;
}
