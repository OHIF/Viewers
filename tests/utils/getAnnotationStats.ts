type TargetStats = Record<string, unknown>;

type AnnotationStats = {
  annotationUID: string;
  toolName: string;
  referencedImageId?: string;
  FrameOfReferenceUID?: string;
  cachedStats: Record<string, TargetStats>;
  targetIds: string[];
  firstTargetStats: TargetStats | undefined;
};

type Options = {
  toolName?: string | string[];
  attempts?: number;
  intervalMs?: number;
};

const getAnnotationStats = async (page, options: Options = {}): Promise<AnnotationStats[]> => {
  const { toolName, attempts = 20, intervalMs = 500 } = options;

  const toolNames =
    toolName === undefined ? undefined : Array.isArray(toolName) ? toolName : [toolName];

  for (let i = 0; i < attempts; i++) {
    const results: AnnotationStats[] = await page.evaluate(
      ({ toolNames }) => {
        const cornerstoneTools = (window as any).cornerstoneTools;
        const all = cornerstoneTools?.annotation?.state?.getAllAnnotations?.() ?? [];

        return all
          .filter(a => !toolNames || toolNames.includes(a?.metadata?.toolName))
          .map(a => {
            const cachedStats = a?.data?.cachedStats ?? {};
            const targetIds = Object.keys(cachedStats);
            return {
              annotationUID: a.annotationUID,
              toolName: a.metadata?.toolName,
              referencedImageId: a.metadata?.referencedImageId,
              FrameOfReferenceUID: a.metadata?.FrameOfReferenceUID,
              cachedStats,
              targetIds,
              firstTargetStats: targetIds.length ? cachedStats[targetIds[0]] : undefined,
            };
          });
      },
      { toolNames }
    );

    const populated = results.filter(r => r.targetIds.length > 0);
    if (populated.length > 0) {
      return populated;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `No annotations${toolNames ? ` for tool(s) ${toolNames.join(',')}` : ''} with populated cachedStats found`
  );
};

export { getAnnotationStats };
export type { AnnotationStats, TargetStats };
