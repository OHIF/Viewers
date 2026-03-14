/**
 * GPU Performance Test Utility
 *
 * This utility tests GPU performance capabilities to help determine
 * optimal decimation settings for volume rendering in OHIF.
 */

import { setVolumeOptions } from '@ohif/core';

// Canvas Configuration
const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 512;

// Default Values
const DEFAULT_ANISOTROPY = 1;
const DEFAULT_RETURN_VALUE = 0;

// Shader Constants
const SHADER_POSITION_Z = 0.0;
const SHADER_POSITION_W = 1.0;
const SHADER_COLOR_R = 1.0;
const SHADER_COLOR_G = 0.0;
const SHADER_COLOR_B = 0.0;
const SHADER_COLOR_A = 1.0;

// Triangle Vertex Data
const TRIANGLE_VERTEX_1_X = -1;
const TRIANGLE_VERTEX_1_Y = -1;
const TRIANGLE_VERTEX_2_X = 1;
const TRIANGLE_VERTEX_2_Y = -1;
const TRIANGLE_VERTEX_3_X = 0;
const TRIANGLE_VERTEX_3_Y = 1;
const VERTEX_ATTRIBUTE_SIZE = 2;
const VERTICES_PER_TRIANGLE = 3;

// Test Configuration
const TRIANGLE_RENDERING_TEST_DURATION_MS = 100;
const BUFFER_OPERATIONS_TEST_DURATION_MS = 50;
const TEXTURE_TEST_SIZE = 1024;
const BUFFER_TEST_SIZE_FLOATS = 10000;

// Color Channels
const RGBA_CHANNELS = 4;

// Time Conversion
const MILLISECONDS_PER_SECOND = 1000;

// Memory Conversion
const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

// Scoring Weights
const SCORE_WEIGHT_TRIANGLE_RENDERING = 0.4;
const SCORE_WEIGHT_TEXTURE_UPLOAD = 0.3;
const SCORE_WEIGHT_BUFFER_OPERATIONS = 0.2;
const SCORE_WEIGHT_HARDWARE = 0.1;

// Score Normalization
const NORMALIZATION_DIVISOR_TRIANGLES = 1000000;
const NORMALIZATION_DIVISOR_TEXTURE = 1000;
const NORMALIZATION_DIVISOR_BUFFER = 10000;
const MAX_NORMALIZED_VALUE = 1;
const SCORE_MULTIPLIER = 100;

// Hardware Scoring
const HARDWARE_BASE_SCORE = 50;
const HARDWARE_SCORE_INCREMENT_LARGE = 20;
const HARDWARE_SCORE_INCREMENT_MEDIUM = 10;
const TEXTURE_SIZE_THRESHOLD_LARGE = 8192;
const TEXTURE_SIZE_THRESHOLD_VERY_LARGE = 16384;
const TEXTURE_UNITS_THRESHOLD = 32;
const ANISOTROPY_THRESHOLD = 16;

// Performance Level Thresholds
const PERFORMANCE_THRESHOLD_VERY_HIGH = 80;
const PERFORMANCE_THRESHOLD_HIGH = 60;
const PERFORMANCE_THRESHOLD_MEDIUM = 40;

// Failed Test Defaults
const FAILED_SCORE = 0;
const FAILED_DECIMATION_X = 2;
const FAILED_DECIMATION_Y = 2;
const FAILED_DECIMATION_Z = 1;
const FAILED_MAX_TEXTURE_SIZE = 0;
const MAX_SCORE_DISPLAY = 100;

// Recommended Decimation by Performance Level [I, J, K]
const DECIMATION_VERY_HIGH: [number, number, number] = [1, 1, 1];
const DECIMATION_HIGH: [number, number, number] = [1, 1, 1];
const DECIMATION_MEDIUM: [number, number, number] = [2, 2, 1];
const DECIMATION_LOW: [number, number, number] = [2, 2, 1];

interface GPUPerformanceResult {
  score: number;
  level: 'low' | 'medium' | 'high' | 'very-high';
  recommendedDecimation: [number, number, number];
  details: {
    webglVersion: string;
    renderer: string;
    vendor: string;
    maxTextureSize: number;
    maxVertexAttribs: number;
    maxVaryingVectors: number;
    maxFragmentUniforms: number;
    maxVertexUniforms: number;
    maxTextureImageUnits: number;
    maxVertexTextureImageUnits: number;
    maxCombinedTextureImageUnits: number;
    maxRenderBufferSize: number;
    maxViewportDims: number[];
    aliasedLineWidthRange: number[];
    aliasedPointSizeRange: number[];
    maxAnisotropy: number;
    extensions: string[];
    memoryInfo?: {
      totalJSHeapSize: number;
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };
  testResults: {
    triangleRendering: number;
    textureUpload: number;
    bufferOperations: number;
  };
}

class GPUPerformanceTester {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;

  async runTest(): Promise<GPUPerformanceResult> {
    console.log('Starting GPU Performance Test...');

    try {
      this.initializeWebGL();

      if (!this.gl) {
        throw new Error('Failed to initialize WebGL context');
      }

      const basicInfo = this.getBasicGPUInfo();
      const testResults = await this.runPerformanceTests();
      const score = this.calculateScore(testResults, basicInfo);
      const level = this.getPerformanceLevel(score);
      const recommendedDecimation = this.getRecommendedDecimation(level);

      const result: GPUPerformanceResult = {
        score,
        level,
        recommendedDecimation,
        details: basicInfo,
        testResults,
      };
      return result;
    } catch (error) {
      console.error('GPU Performance Test Failed:', error);
      throw error;
    } finally {
      this.cleanup();
    }
  }

  private initializeWebGL(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    const context =
      this.canvas.getContext('webgl2') ||
      this.canvas.getContext('webgl') ||
      this.canvas.getContext('experimental-webgl');
    this.gl = context as WebGLRenderingContext | WebGL2RenderingContext | null;
  }

  private getBasicGPUInfo() {
    if (!this.gl) throw new Error('WebGL not available');

    const debugInfo = this.gl.getExtension('WEBGL_debug_renderer_info');
    const memoryInfo = (performance as Performance & { memory?: unknown })
      .memory;

    return {
      webglVersion: this.gl.getParameter(this.gl.VERSION),
      renderer: debugInfo
        ? this.gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : 'Unknown',
      vendor: debugInfo
        ? this.gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : 'Unknown',
      maxTextureSize: this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS),
      maxVaryingVectors: this.gl.getParameter(this.gl.MAX_VARYING_VECTORS),
      maxFragmentUniforms: this.gl.getParameter(
        this.gl.MAX_FRAGMENT_UNIFORM_VECTORS
      ),
      maxVertexUniforms: this.gl.getParameter(
        this.gl.MAX_VERTEX_UNIFORM_VECTORS
      ),
      maxTextureImageUnits: this.gl.getParameter(
        this.gl.MAX_TEXTURE_IMAGE_UNITS
      ),
      maxVertexTextureImageUnits: this.gl.getParameter(
        this.gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS
      ),
      maxCombinedTextureImageUnits: this.gl.getParameter(
        this.gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS
      ),
      maxRenderBufferSize: this.gl.getParameter(this.gl.MAX_RENDERBUFFER_SIZE),
      maxViewportDims: this.gl.getParameter(this.gl.MAX_VIEWPORT_DIMS),
      aliasedLineWidthRange: this.gl.getParameter(
        this.gl.ALIASED_LINE_WIDTH_RANGE
      ),
      aliasedPointSizeRange: this.gl.getParameter(
        this.gl.ALIASED_POINT_SIZE_RANGE
      ),
      maxAnisotropy: this.getMaxAnisotropy(),
      extensions: this.gl.getSupportedExtensions() || [],
      memoryInfo: memoryInfo
        ? {
            totalJSHeapSize: (memoryInfo as { totalJSHeapSize: number })
              .totalJSHeapSize,
            usedJSHeapSize: (memoryInfo as { usedJSHeapSize: number })
              .usedJSHeapSize,
            jsHeapSizeLimit: (memoryInfo as { jsHeapSizeLimit: number })
              .jsHeapSizeLimit,
          }
        : undefined,
    };
  }

  private getMaxAnisotropy(): number {
    if (!this.gl) return DEFAULT_ANISOTROPY;

    const ext =
      this.gl.getExtension('EXT_texture_filter_anisotropic') ||
      this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
      this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic');

    return ext
      ? this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
      : DEFAULT_ANISOTROPY;
  }

  private async runPerformanceTests() {
    if (!this.gl) throw new Error('WebGL not available');

    console.log('Running GPU performance tests...');

    const tests = await Promise.all([
      this.testTriangleRendering(),
      this.testTextureUpload(),
      this.testBufferOperations(),
    ]);

    return {
      triangleRendering: tests[0],
      textureUpload: tests[1],
      bufferOperations: tests[2],
    };
  }

  private async testTriangleRendering(): Promise<number> {
    if (!this.gl) return DEFAULT_RETURN_VALUE;

    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(
      vertexShader,
      `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, ${SHADER_POSITION_Z.toFixed(1)}, ${SHADER_POSITION_W.toFixed(1)});
      }
    `
    );

    this.gl.shaderSource(
      fragmentShader,
      `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(${SHADER_COLOR_R.toFixed(1)}, ${SHADER_COLOR_G.toFixed(1)}, ${SHADER_COLOR_B.toFixed(1)}, ${SHADER_COLOR_A.toFixed(1)});
      }
    `
    );

    this.gl.compileShader(vertexShader);
    this.gl.compileShader(fragmentShader);

    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    this.gl.useProgram(program);

    const vertices = new Float32Array([
      TRIANGLE_VERTEX_1_X,
      TRIANGLE_VERTEX_1_Y,
      TRIANGLE_VERTEX_2_X,
      TRIANGLE_VERTEX_2_Y,
      TRIANGLE_VERTEX_3_X,
      TRIANGLE_VERTEX_3_Y,
    ]);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      vertices,
      this.gl.STATIC_DRAW
    );

    const positionLocation = this.gl.getAttribLocation(program, 'position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(
      positionLocation,
      VERTEX_ATTRIBUTE_SIZE,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    const startTime = performance.now();
    const testDuration = TRIANGLE_RENDERING_TEST_DURATION_MS;

    let triangleCount = 0;
    while (performance.now() - startTime < testDuration) {
      this.gl.drawArrays(this.gl.TRIANGLES, 0, VERTICES_PER_TRIANGLE);
      triangleCount++;
    }

    const endTime = performance.now();
    const trianglesPerSecond =
      (triangleCount * VERTICES_PER_TRIANGLE) /
      ((endTime - startTime) / MILLISECONDS_PER_SECOND);

    this.gl.deleteBuffer(buffer);
    this.gl.deleteProgram(program);
    this.gl.deleteShader(vertexShader);
    this.gl.deleteShader(fragmentShader);

    return Math.round(trianglesPerSecond);
  }

  private async testTextureUpload(): Promise<number> {
    if (!this.gl) return DEFAULT_RETURN_VALUE;

    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

    const size = TEXTURE_TEST_SIZE;
    const data = new Uint8Array(size * size * RGBA_CHANNELS);

    const startTime = performance.now();
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      size,
      size,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      data
    );
    const endTime = performance.now();

    const uploadTime = endTime - startTime;
    const dataSizeMB = (size * size * RGBA_CHANNELS) / BYTES_PER_MB;
    const mbPerSecond =
      dataSizeMB / (uploadTime / MILLISECONDS_PER_SECOND);

    this.gl.deleteTexture(texture);
    return Math.round(mbPerSecond);
  }

  private async testBufferOperations(): Promise<number> {
    if (!this.gl) return DEFAULT_RETURN_VALUE;

    const buffer = this.gl.createBuffer();
    const data = new Float32Array(BUFFER_TEST_SIZE_FLOATS);

    const startTime = performance.now();
    const testDuration = BUFFER_OPERATIONS_TEST_DURATION_MS;

    let operations = 0;
    while (performance.now() - startTime < testDuration) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        data,
        this.gl.STATIC_DRAW
      );
      operations++;
    }

    const endTime = performance.now();
    const operationsPerSecond =
      operations / ((endTime - startTime) / MILLISECONDS_PER_SECOND);

    this.gl.deleteBuffer(buffer);
    return Math.round(operationsPerSecond);
  }

  private calculateScore(
    testResults: { triangleRendering: number; textureUpload: number; bufferOperations: number },
    basicInfo: { maxTextureSize: number; maxCombinedTextureImageUnits: number; maxAnisotropy: number }
  ): number {
    const weights = {
      triangleRendering: SCORE_WEIGHT_TRIANGLE_RENDERING,
      textureUpload: SCORE_WEIGHT_TEXTURE_UPLOAD,
      bufferOperations: SCORE_WEIGHT_BUFFER_OPERATIONS,
      hardware: SCORE_WEIGHT_HARDWARE,
    };

    const triangleScore =
      Math.min(
        testResults.triangleRendering / NORMALIZATION_DIVISOR_TRIANGLES,
        MAX_NORMALIZED_VALUE
      ) * SCORE_MULTIPLIER;
    const textureScore =
      Math.min(
        testResults.textureUpload / NORMALIZATION_DIVISOR_TEXTURE,
        MAX_NORMALIZED_VALUE
      ) * SCORE_MULTIPLIER;
    const bufferScore =
      Math.min(
        testResults.bufferOperations / NORMALIZATION_DIVISOR_BUFFER,
        MAX_NORMALIZED_VALUE
      ) * SCORE_MULTIPLIER;

    let hardwareScore = HARDWARE_BASE_SCORE;
    if (basicInfo.maxTextureSize >= TEXTURE_SIZE_THRESHOLD_LARGE)
      hardwareScore += HARDWARE_SCORE_INCREMENT_LARGE;
    if (basicInfo.maxTextureSize >= TEXTURE_SIZE_THRESHOLD_VERY_LARGE)
      hardwareScore += HARDWARE_SCORE_INCREMENT_MEDIUM;
    if (basicInfo.maxCombinedTextureImageUnits >= TEXTURE_UNITS_THRESHOLD)
      hardwareScore += HARDWARE_SCORE_INCREMENT_MEDIUM;
    if (basicInfo.maxAnisotropy >= ANISOTROPY_THRESHOLD)
      hardwareScore += HARDWARE_SCORE_INCREMENT_MEDIUM;

    const totalScore =
      triangleScore * weights.triangleRendering +
      textureScore * weights.textureUpload +
      bufferScore * weights.bufferOperations +
      hardwareScore * weights.hardware;

    return Math.round(totalScore);
  }

  private getPerformanceLevel(
    score: number
  ): 'low' | 'medium' | 'high' | 'very-high' {
    if (score >= PERFORMANCE_THRESHOLD_VERY_HIGH) return 'very-high';
    if (score >= PERFORMANCE_THRESHOLD_HIGH) return 'high';
    if (score >= PERFORMANCE_THRESHOLD_MEDIUM) return 'medium';
    return 'low';
  }

  private getRecommendedDecimation(
    level: 'low' | 'medium' | 'high' | 'very-high'
  ): [number, number, number] {
    switch (level) {
      case 'very-high':
        return DECIMATION_VERY_HIGH;
      case 'high':
        return DECIMATION_HIGH;
      case 'medium':
        return DECIMATION_MEDIUM;
      case 'low':
        return DECIMATION_LOW;
      default:
        return DECIMATION_MEDIUM;
    }
  }

  private cleanup(): void {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.gl = null;
  }
}

/**
 * Run GPU performance test and return results
 */
export async function runGPUPerformanceTest(): Promise<GPUPerformanceResult> {
  const tester = new GPUPerformanceTester();
  return tester.runTest();
}

type volumeDownsamplingConfig = {
  highGpu?: {
    rotateSampleDistanceFactor: number;
    sampleDistanceMultiplier: number;
  };
  midGpu?: {
    rotateSampleDistanceFactor: number;
    sampleDistanceMultiplier: number;
  };
  lowGpu?: {
    rotateSampleDistanceFactor: number;
    sampleDistanceMultiplier: number;
  };
  thresholdHighPercent?: number;
  thresholdMidPercent?: number;
};

function getvolumeDownsamplingFromConfig(
  appConfig?: { customizationService?: Array<Record<string, unknown>> }
): volumeDownsamplingConfig | undefined {
  const list = appConfig?.customizationService;
  if (!Array.isArray(list)) return undefined;
  const entry = list.find(
    (c): c is Record<string, volumeDownsamplingConfig> =>
      c != null &&
      typeof c === 'object' &&
      'volumeDownsampling' in c
  );
  return entry?.volumeDownsampling;
}

function getGpuTier(
  score: number,
  config: volumeDownsamplingConfig | undefined
): 'high' | 'mid' | 'low' {
  const high = config?.thresholdHighPercent ?? 100;
  const mid = config?.thresholdMidPercent ?? 60;
  if (score >= high) return 'high';
  if (score >= mid) return 'mid';
  return 'low';
}

function getSamplingDefaults(
  score: number,
  config: volumeDownsamplingConfig | undefined
) {
  const tier = getGpuTier(score, config);
  const mapping =
    tier === 'high'
      ? config?.highGpu
      : tier === 'mid'
        ? config?.midGpu
        : config?.lowGpu;
  const defaults = {
    high: { rotateSampleDistanceFactor: 2, sampleDistanceMultiplier: 1 },
    mid: { rotateSampleDistanceFactor: 2, sampleDistanceMultiplier: 2 },
    low: { rotateSampleDistanceFactor: 3, sampleDistanceMultiplier: 2 },
  }[tier];
  return {
    rotateSampleDistanceFactor:
      mapping?.rotateSampleDistanceFactor ?? defaults.rotateSampleDistanceFactor,
    sampleDistanceMultiplier:
      mapping?.sampleDistanceMultiplier ?? defaults.sampleDistanceMultiplier,
  };
}

/**
 * GPU performance test helper for console logging and caching results.
 * Runs once (when gpuTestResults is missing); sets rotateSampleDistanceFactor and
 * sampleDistanceMultiplier from config based on score; after that the user controls values in localStorage.
 */
export async function gpuPerformanceTest(
  appConfig?: { customizationService?: Array<Record<string, unknown>> }
): Promise<void> {
  const volumeDownsampling = getvolumeDownsamplingFromConfig(appConfig);

  try {
    const result = await runGPUPerformanceTest();

    const gpuTestResults = {
      generalPerformanceScore: result.score,
      renderer: result.details.renderer,
      maxTextureSize: result.details.maxTextureSize,
      memoryUsedMB: result.details.memoryInfo
        ? Math.round(
            result.details.memoryInfo.usedJSHeapSize /
              BYTES_PER_KB /
              BYTES_PER_KB
          )
        : DEFAULT_RETURN_VALUE,
      memoryLimitMB: result.details.memoryInfo
        ? Math.round(
            result.details.memoryInfo.jsHeapSizeLimit /
              BYTES_PER_KB /
              BYTES_PER_KB
          )
        : DEFAULT_RETURN_VALUE,
      ...result.testResults,
    };

    const { rotateSampleDistanceFactor, sampleDistanceMultiplier } =
      getSamplingDefaults(result.score, volumeDownsampling);

    setVolumeOptions({
      gpuTestResults,
      rotateSampleDistanceFactor,
      sampleDistanceMultiplier,
    });

    console.log('GPU Performance Test Results:');
    console.log(
      `Overall Score: ${result.score}/${MAX_SCORE_DISPLAY} (${result.level})`
    );
    console.log(`GPU: ${result.details.renderer}`);
    console.log(
      `Max Texture Size: ${result.details.maxTextureSize}x${result.details.maxTextureSize}`
    );
    console.log(
      `Triangles/sec: ${result.testResults.triangleRendering.toLocaleString()}`
    );
    console.log(`Texture Upload: ${result.testResults.textureUpload} MB/s`);
    console.log(
      `Buffer Operations: ${result.testResults.bufferOperations.toLocaleString()}/s`
    );

    if (result.details.memoryInfo) {
      console.log(
        `Memory: ${Math.round(result.details.memoryInfo.usedJSHeapSize / BYTES_PER_KB / BYTES_PER_KB)}MB used / ${Math.round(result.details.memoryInfo.jsHeapSizeLimit / BYTES_PER_KB / BYTES_PER_KB)}MB limit`
      );
    }

    (window as Window & { gpuPerformanceResult?: GPUPerformanceResult }).gpuPerformanceResult =
      result;
  } catch (error) {
    console.error('GPU Performance Test failed:', error);

    const failedResult = {
      generalPerformanceScore: FAILED_SCORE,
      renderer: 'Unknown',
      maxTextureSize: FAILED_MAX_TEXTURE_SIZE,
      level: 'failed',
      testResults: {
        triangleRendering: DEFAULT_RETURN_VALUE,
        textureUpload: DEFAULT_RETURN_VALUE,
        bufferOperations: DEFAULT_RETURN_VALUE,
      },
    };

    const { rotateSampleDistanceFactor, sampleDistanceMultiplier } =
      getSamplingDefaults(FAILED_SCORE, volumeDownsampling);

    setVolumeOptions({
      gpuTestResults: failedResult,
      rotateSampleDistanceFactor,
      sampleDistanceMultiplier,
    });

    (window as Window & { gpuPerformanceResult?: GPUPerformanceResult }).gpuPerformanceResult = {
      score: FAILED_SCORE,
      level: 'failed',
      recommendedDecimation: [
        FAILED_DECIMATION_X,
        FAILED_DECIMATION_Y,
        FAILED_DECIMATION_Z,
      ] as [number, number, number],
      details: {
        renderer: 'Unknown',
        maxTextureSize: FAILED_MAX_TEXTURE_SIZE,
      },
      testResults: {
        triangleRendering: DEFAULT_RETURN_VALUE,
        textureUpload: DEFAULT_RETURN_VALUE,
        bufferOperations: DEFAULT_RETURN_VALUE,
      },
    };
  }
}

export default gpuPerformanceTest;
