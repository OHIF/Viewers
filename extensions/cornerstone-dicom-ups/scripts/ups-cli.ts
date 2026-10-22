/**
 * Dev/E2E CLI for the UPS-RS Task Requester + Watcher. Mirrors the Weasis
 * `ups:` verbs (search/run/watch/outputs/cancel) against a live origin.
 *
 * Usage (from extensions/cornerstone-dicom-ups):
 *   node -r ts-node/register/transpile-only scripts/ups-cli.ts \
 *     <verb> --url <dicomwebBase> [--ae <aeTitle>] [args]
 *
 * Verbs:
 *   search   <studyUid> [patientId] [accessionNumber]
 *   run      <studyUid> <codeValue> [codeDesignator] [codeMeaning]
 *   watch    <workitemUid>            (polls until COMPLETED/CANCELED)
 *   outputs  <workitemUid>
 *   cancel   <workitemUid>
 */
import { UpsClient } from '../src/services/UpsClient';
import { UpsService } from '../src/services/UpsService';
import { DicomJsonDataset, TAG, WorkitemCode, getString } from '../src/services/types';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';

/**
 * A fetch-compatible transport over Node http(s) that always sends
 * Content-Length. Browser `fetch` always sets Content-Length, while Node's
 * `fetch` sends chunked; this adapter makes the CLI exercise the same
 * request shape the viewer will send in the browser.
 */
function cliFetch(input: string | URL, init: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const url = new URL(String(input));
    const body = init.body ? String(init.body) : '';
    const lib = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = lib(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: init.method || 'GET',
        headers: {
          ...(init.headers as Record<string, string>),
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          resolve({
            ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
            status: res.statusCode ?? 0,
            json: async () => JSON.parse(data),
            text: async () => data,
          } as Response);
        });
      }
    );
    req.on('error', reject);
    req.end(body);
  });
}

function usage(): never {
  console.error(
    'usage: ups-cli.ts <search|run|watch|outputs|cancel> --url <base> [--ae <ae>] [args]'
  );
  process.exit(2);
}

function parseArgs(argv: string[]): { verb: string; url: string; ae?: string; rest: string[] } {
  if (argv.length === 0) usage();
  const verb = argv[0];
  let url = '';
  let ae: string | undefined;
  const rest: string[] = [];
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--url') url = argv[++i];
    else if (argv[i] === '--ae') ae = argv[++i];
    else rest.push(argv[i]);
  }
  if (!url) {
    console.error('missing --url');
    usage();
  }
  return { verb, url: url.replace(/\/+$/, ''), ae, rest };
}

async function qidoInstances(baseUrl: string, studyUid: string): Promise<DicomJsonDataset[]> {
  const res = await fetch(`${baseUrl}/studies/${encodeURIComponent(studyUid)}/instances`, {
    headers: { Accept: 'application/dicom+json' },
  });
  if (!res.ok) throw new Error(`QIDO instances failed: HTTP ${res.status}`);
  return (await res.json()) as DicomJsonDataset[];
}

function stateOf(wi: DicomJsonDataset): string {
  return getString(wi, TAG.ProcedureStepState) ?? '?';
}

function codeOf(wi: DicomJsonDataset): string {
  const codes = wi[TAG.ScheduledWorkitemCodeSequence]?.Value;
  if (Array.isArray(codes) && codes.length > 0) {
    return getString(codes[0] as DicomJsonDataset, TAG.CodeValue) ?? '?';
  }
  return '?';
}

async function main() {
  const { verb, url, ae, rest } = parseArgs(process.argv.slice(2));
  const client = new UpsClient(
    { baseUrl: url, aeTitle: ae },
    { fetchImpl: cliFetch, openWebSocket: wsUrl => new WebSocket(wsUrl) }
  );
  const service = new UpsService(client, ae);

  switch (verb) {
    case 'search': {
      const [studyUid, patientId, accessionNumber] = rest;
      if (!studyUid) usage();
      const items = await service.search(studyUid, patientId, accessionNumber);
      console.log(`workitems: ${items.length}`);
      for (const wi of items) {
        console.log(`  ${getString(wi, TAG.SOPInstanceUID) ?? '?'}  ${stateOf(wi)}  ${codeOf(wi)}`);
      }
      break;
    }
    case 'run': {
      const [studyUid, codeValue, designator, meaning] = rest;
      if (!studyUid || !codeValue) usage();
      const code: WorkitemCode = {
        codeValue,
        codingSchemeDesignator: designator || '99CLARUS',
        codeMeaning: meaning,
      };
      const study: DicomJsonDataset = { [TAG.StudyInstanceUID]: { vr: 'UI', Value: [studyUid] } };
      const instances = await qidoInstances(url, studyUid);
      console.log(`study ${studyUid}: ${instances.length} instance(s)`);
      const uid = await service.run(code, study, instances);
      console.log(`workitem ${uid}`);
      break;
    }
    case 'watch': {
      const [workitemUid] = rest;
      if (!workitemUid) usage();
      let state = '';
      for (let i = 0; i < 60; i++) {
        const wi = await client.retrieveWorkitem(workitemUid);
        const next = stateOf(wi);
        if (next !== state) {
          state = next;
          console.log(`${workitemUid} -> ${state}`);
        }
        if (state === 'COMPLETED' || state === 'CANCELED') {
          if (state === 'CANCELED') {
            console.log(`reason: ${getString(wi, TAG.ReasonForCancellation) ?? '?'}`);
          }
          const outputs = await service.outputInstanceUids(workitemUid);
          console.log(`outputs: ${outputs.length ? outputs.join(', ') : '(none)'}`);
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      console.error('timed out waiting for a terminal state');
      process.exit(1);
      break;
    }
    case 'outputs': {
      const [workitemUid] = rest;
      if (!workitemUid) usage();
      const outputs = await service.outputInstanceUids(workitemUid);
      console.log(`outputs: ${outputs.length ? outputs.join(', ') : '(none)'}`);
      break;
    }
    case 'cancel': {
      const [workitemUid, reason] = rest;
      if (!workitemUid) usage();
      await service.cancel(
        workitemUid,
        reason ? { codeValue: reason, codingSchemeDesignator: '99CLARUS' } : undefined
      );
      console.log(`canceled ${workitemUid}`);
      break;
    }
    default:
      usage();
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
