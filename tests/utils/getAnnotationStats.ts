type TargetStats = Record<string, unknown>;

type AnnotationStats = {
  annotationUID: string;
  toolName: string;
  referencedImageId?: string;
  FrameOfReferenceUID?: string;
  label?: string;
  text?: string;
  cachedStats: Record<string, TargetStats>;
  targetIds: string[];
  firstTargetStats: TargetStats | undefined;
};

type Options = {
  toolName?: string | string[];
  attempts?: number;
  intervalMs?: number;
  /**
   * When true (default), only resolves once at least one matching annotation has
   * populated `cachedStats`. Set to false for tools whose source of truth is
   * `data.label`/`data.text` rather than computed stats (e.g. `ArrowAnnotate`),
   * in which case any matching annotation is returned.
   */
  requireStats?: boolean;
};

const getAnnotationStats = async (page, options: Options = {}): Promise<AnnotationStats[]> => {
  const { toolName, attempts = 20, intervalMs = 500, requireStats = true } = options;

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
              label: a?.data?.label,
              text: a?.data?.text,
              cachedStats,
              targetIds,
              firstTargetStats: targetIds.length ? cachedStats[targetIds[0]] : undefined,
            };
          });
      },
      { toolNames }
    );

    const matching = requireStats ? results.filter(r => r.targetIds.length > 0) : results;
    if (matching.length > 0) {
      return matching;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `No annotations${toolNames ? ` for tool(s) ${toolNames.join(',')}` : ''}${
      requireStats ? ' with populated cachedStats' : ''
    } found`
  );
};

export { getAnnotationStats };
export type { AnnotationStats, TargetStats };
