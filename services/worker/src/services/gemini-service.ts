import { GoogleGenerativeAI } from '@google/generative-ai';
import sharp from 'sharp';

// Types and interfaces
export interface GeminiServiceConfig {
  apiKey: string;
  model: 'gemini-2.5-flash-image-preview';
  maxRetries: 3;
  retryDelayMs: 1000;
  timeoutMs: 30000;
}

export interface GenerationRequest {
  imageBase64: string;
  mimeType: string;
  complexity: 'simple' | 'standard' | 'detailed';
  lineThickness: 'thin' | 'medium' | 'thick';
  customPrompt?: string;
}

export interface TextGenerationRequest {
  textPrompt: string;
  complexity: 'simple' | 'standard' | 'detailed';
  lineThickness: 'thin' | 'medium' | 'thick';
}

export interface EditRequest {
  existingImageBase64: string;
  mimeType: string;
  editPrompt: string;
  complexity: 'simple' | 'standard' | 'detailed';
  lineThickness: 'thin' | 'medium' | 'thick';
  originalPrompt?: string;
}

export interface GenerationResult {
  success: boolean;
  imageBase64?: string;
  error?: GeminiError;
  metadata: {
    responseTimeMs: number;
    tokensUsed?: number;
    cost: number; // $0.039 per image
    model: string;
    promptUsed: string;
  };
}

export enum GeminiErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  TEMPORARY_FAILURE = 'TEMPORARY_FAILURE',
  INVALID_INPUT = 'INVALID_INPUT',
  MODEL_ERROR = 'MODEL_ERROR'
}

export interface GeminiError {
  type: GeminiErrorType;
  message: string;
  retryable: boolean;
  originalError?: any;
}

// Cost per image generation (as per Phase 1 assessment)
const COST_PER_GENERATION = 0.039;

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private config: GeminiServiceConfig;

  constructor(config: GeminiServiceConfig) {
    this.config = config;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }

  /**
   * Generate coloring page from text prompt
   */
  async generateColoringPageFromText(request: TextGenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateTextRequest(request);

      // Generate prompt based on complexity and line thickness
      const prompt = this.buildTextPrompt(request.textPrompt, request.complexity, request.lineThickness);

      // Attempt generation with retry logic
      const result = await this.generateFromTextWithRetry(prompt);

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        imageBase64: result,
        metadata: {
          responseTimeMs: responseTime,
          cost: COST_PER_GENERATION,
          model: this.config.model,
          promptUsed: prompt
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const geminiError = this.categorizeError(error);

      return {
        success: false,
        error: geminiError,
        metadata: {
          responseTimeMs: responseTime,
          cost: geminiError.retryable ? 0 : COST_PER_GENERATION, // Don't charge for retryable failures
          model: this.config.model,
          promptUsed: this.buildTextPrompt(request.textPrompt, request.complexity, request.lineThickness)
        }
      };
    }
  }

  /**
   * Edit existing coloring page with user prompt modifications
   */
  async editColoringPage(request: EditRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateEditRequest(request);

      // Prepare existing image for optimal API usage
      const processedImage = await this.preprocessImage(request.existingImageBase64, request.mimeType);

      // Generate edit prompt based on user request and existing parameters
      const prompt = this.buildEditPrompt(request.editPrompt, request.complexity, request.lineThickness, request.originalPrompt);

      // Attempt generation with retry logic
      const result = await this.generateWithRetry(processedImage, prompt);

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        imageBase64: result,
        metadata: {
          responseTimeMs: responseTime,
          cost: COST_PER_GENERATION,
          model: this.config.model,
          promptUsed: prompt
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const geminiError = this.categorizeError(error);

      return {
        success: false,
        error: geminiError,
        metadata: {
          responseTimeMs: responseTime,
          cost: geminiError.retryable ? 0 : COST_PER_GENERATION, // Don't charge for retryable failures
          model: this.config.model,
          promptUsed: this.buildEditPrompt(request.editPrompt, request.complexity, request.lineThickness, request.originalPrompt)
        }
      };
    }
  }

  /**
   * Generate coloring page from image with PRD-specified controls
   */
  async generateColoringPage(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateRequest(request);

      // Prepare image for optimal API usage
      const processedImage = await this.preprocessImage(request.imageBase64, request.mimeType);

      // Generate prompt based on complexity and line thickness
      const prompt = this.buildPrompt(request.complexity, request.lineThickness, request.customPrompt);

      // Attempt generation with retry logic
      const result = await this.generateWithRetry(processedImage, prompt);

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        imageBase64: result,
        metadata: {
          responseTimeMs: responseTime,
          cost: COST_PER_GENERATION,
          model: this.config.model,
          promptUsed: prompt
        }
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const geminiError = this.categorizeError(error);

      return {
        success: false,
        error: geminiError,
        metadata: {
          responseTimeMs: responseTime,
          cost: geminiError.retryable ? 0 : COST_PER_GENERATION, // Don't charge for retryable failures
          model: this.config.model,
          promptUsed: this.buildPrompt(request.complexity, request.lineThickness, request.customPrompt)
        }
      };
    }
  }

  /**
   * Build prompt based on PRD parameters
   */
  private buildPrompt(complexity: string, lineThickness: string, customPrompt?: string): string {
    // Base prompt foundation
    let prompt = `Transform this image into a black and white coloring page suitable for printing at 300 DPI. `;

    // Complexity mapping (from PRD: Simple/Standard/Detailed)
    switch (complexity) {
      case 'simple':
        prompt += `Create a simple coloring page for children ages 4-6. Use very basic shapes with minimal detail. `;
        prompt += `Simplify complex elements into large, easy-to-color regions. Remove small details and merge similar elements. `;
        break;
      case 'standard':
        prompt += `Create a standard coloring page for children ages 6-10. Include moderate detail while keeping shapes manageable. `;
        prompt += `Maintain important features but simplify textures and backgrounds. `;
        break;
      case 'detailed':
        prompt += `Create a detailed coloring page for children ages 8-12 and adults. Preserve fine details and intricate patterns. `;
        prompt += `Include background elements and complex textures that can be colored separately. `;
        break;
    }

    // Line thickness mapping (from PRD: Thin/Medium/Thick)
    switch (lineThickness) {
      case 'thin':
        prompt += `Use thin, precise lines (1-1.5px width at 300 DPI) for detailed work. `;
        break;
      case 'medium':
        prompt += `Use medium-weight lines (2-3px width at 300 DPI) for balanced coloring. `;
        break;
      case 'thick':
        prompt += `Use thick, bold lines (3-4px width at 300 DPI) perfect for younger children and crayons. `;
        break;
    }

    // Common requirements for all variations
    prompt += `Requirements: `;
    prompt += `- Pure black lines (#000000) on pure white background (#FFFFFF) `;
    prompt += `- No colors, shading, gradients, or gray tones `;
    prompt += `- Clean, continuous outlines with no gaps `;
    prompt += `- Closed shapes that can be easily filled with color `;
    prompt += `- Remove all photographic textures and replace with simple patterns `;
    prompt += `- Ensure the result is suitable for printing and coloring with crayons, markers, or colored pencils. `;

    // Add custom prompt if provided
    if (customPrompt) {
      prompt += `Additional instructions: ${customPrompt}`;
    }

    return prompt;
  }

  /**
   * Preprocess image for optimal API performance
   */
  private async preprocessImage(base64Image: string, _mimeType: string): Promise<{ data: string; mimeType: string }> {
    try {
      const imageBuffer = Buffer.from(base64Image, 'base64');

      // Optimize image size for API (max 1024x1024 as per test files)
      const processedBuffer = await sharp(imageBuffer)
        .resize(1024, 1024, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 }) // Convert to JPEG for consistent format
        .toBuffer();

      return {
        data: processedBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      };
    } catch (error) {
      throw new Error(`Image preprocessing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate with exponential backoff retry logic
   */
  private async generateWithRetry(
    image: { data: string; mimeType: string },
    prompt: string
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.config.model });

    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // ⏱️  START TIMING: Gemini API call
        const geminiStartTime = Date.now();
        console.log(`⏱️  [Gemini API] Starting image generation (attempt ${attempt + 1}/${this.config.maxRetries + 1})`);

        const result = await model.generateContent([
          {
            inlineData: {
              data: image.data,
              mimeType: image.mimeType
            }
          },
          prompt
        ]);

        // ⏱️  END TIMING: Gemini API call
        const geminiDuration = Date.now() - geminiStartTime;
        console.log(`⏱️  [Gemini API] Response received in ${geminiDuration}ms (${(geminiDuration / 1000).toFixed(1)}s)`);

        // 🐢 Warn if slow
        if (geminiDuration > 10000) {
          console.warn(`🐢 [Gemini API] SLOW RESPONSE: ${geminiDuration}ms - Expected <10s`);
        }

        // 🚨 Critical if extremely slow
        if (geminiDuration > 60000) {
          console.error(`🚨 [Gemini API] CRITICAL LATENCY: ${geminiDuration}ms - This should be investigated`);
        }

        const response = await result.response;
        const candidates = response.candidates;

        if (candidates && candidates.length > 0) {
          const parts = candidates[0].content?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
              }
            }
          }
        }

        throw new Error('No image data returned from Gemini API');

      } catch (error) {
        lastError = error;
        const errorType = this.categorizeError(error);

        // Don't retry for non-retryable errors
        if (!errorType.retryable || attempt === this.config.maxRetries) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = this.config.retryDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Categorize errors for proper handling
   */
  private categorizeError(error: any): GeminiError {
    const message = error?.message || error?.toString() || 'Unknown error';

    // Quota/billing errors
    if (message.includes('quota') || message.includes('billing') || message.includes('limit')) {
      return {
        type: GeminiErrorType.QUOTA_EXCEEDED,
        message: 'API quota exceeded or billing issue',
        retryable: false,
        originalError: error
      };
    }

    // Input validation errors
    if (message.includes('invalid') || message.includes('format') || message.includes('size')) {
      return {
        type: GeminiErrorType.INVALID_INPUT,
        message: 'Invalid input provided to API',
        retryable: false,
        originalError: error
      };
    }

    // Network/temporary errors
    if (message.includes('network') || message.includes('timeout') || message.includes('connection') ||
        message.includes('503') || message.includes('502') || message.includes('500')) {
      return {
        type: GeminiErrorType.TEMPORARY_FAILURE,
        message: 'Temporary network or service issue',
        retryable: true,
        originalError: error
      };
    }

    // Default to model error
    return {
      type: GeminiErrorType.MODEL_ERROR,
      message: `Model processing error: ${message}`,
      retryable: true,
      originalError: error
    };
  }

  /**
   * Build prompt for editing existing coloring pages
   */
  private buildEditPrompt(editPrompt: string, complexity: string, lineThickness: string, originalPrompt?: string): string {
    // Base editing instruction
    let prompt = `Modify this existing black and white coloring page based on the following edit request: "${editPrompt}". `;

    // Include context from original prompt if available
    if (originalPrompt) {
      prompt += `The original was created with these instructions: "${originalPrompt}". `;
    }

    // Add editing-specific guidance
    prompt += `Make the requested changes while maintaining the overall coloring page format. `;

    // Complexity mapping (from PRD: Simple/Standard/Detailed)
    switch (complexity) {
      case 'simple':
        prompt += `Keep the result simple for children ages 4-6. Use very basic shapes with minimal detail. `;
        prompt += `Simplify any new elements into large, easy-to-color regions. `;
        break;
      case 'standard':
        prompt += `Keep the result at standard complexity for children ages 6-10. Include moderate detail while keeping shapes manageable. `;
        prompt += `Maintain important features but simplify textures and backgrounds. `;
        break;
      case 'detailed':
        prompt += `Maintain detailed complexity for children ages 8-12 and adults. Preserve fine details and intricate patterns. `;
        prompt += `Include background elements and complex textures that can be colored separately. `;
        break;
    }

    // Line thickness mapping (from PRD: Thin/Medium/Thick)
    switch (lineThickness) {
      case 'thin':
        prompt += `Use thin, precise lines (1-1.5px width at 300 DPI) for detailed work. `;
        break;
      case 'medium':
        prompt += `Use medium-weight lines (2-3px width at 300 DPI) for balanced coloring. `;
        break;
      case 'thick':
        prompt += `Use thick, bold lines (3-4px width at 300 DPI) perfect for younger children and crayons. `;
        break;
    }

    // Common requirements for edited coloring pages
    prompt += `Requirements: `;
    prompt += `- Maintain pure black lines (#000000) on pure white background (#FFFFFF) `;
    prompt += `- No colors, shading, gradients, or gray tones `;
    prompt += `- Clean, continuous outlines with no gaps `;
    prompt += `- Closed shapes that can be easily filled with color `;
    prompt += `- Remove all photographic textures and replace with simple patterns `;
    prompt += `- Ensure the result is still suitable for printing and coloring with crayons, markers, or colored pencils `;
    prompt += `- Keep the overall composition recognizable while incorporating the requested changes. `;

    return prompt;
  }

  /**
   * Build prompt for text-to-image generation
   */
  private buildTextPrompt(textPrompt: string, complexity: string, lineThickness: string): string {
    // Start with the user's idea
    let prompt = `Create a black and white coloring page of: ${textPrompt}. `;

    // Complexity mapping (from PRD: Simple/Standard/Detailed)
    switch (complexity) {
      case 'simple':
        prompt += `Make it a simple coloring page for children ages 4-6. Use very basic shapes with minimal detail. `;
        prompt += `Simplify complex elements into large, easy-to-color regions. Remove small details and merge similar elements. `;
        break;
      case 'standard':
        prompt += `Make it a standard coloring page for children ages 6-10. Include moderate detail while keeping shapes manageable. `;
        prompt += `Maintain important features but simplify textures and backgrounds. `;
        break;
      case 'detailed':
        prompt += `Make it a detailed coloring page for children ages 8-12 and adults. Preserve fine details and intricate patterns. `;
        prompt += `Include background elements and complex textures that can be colored separately. `;
        break;
    }

    // Line thickness mapping (from PRD: Thin/Medium/Thick)
    switch (lineThickness) {
      case 'thin':
        prompt += `Use thin, precise lines (1-1.5px width at 300 DPI) for detailed work. `;
        break;
      case 'medium':
        prompt += `Use medium-weight lines (2-3px width at 300 DPI) for balanced coloring. `;
        break;
      case 'thick':
        prompt += `Use thick, bold lines (3-4px width at 300 DPI) perfect for younger children and crayons. `;
        break;
    }

    // Common requirements for all variations
    prompt += `Requirements: `;
    prompt += `- Pure black lines (#000000) on pure white background (#FFFFFF) `;
    prompt += `- No colors, shading, gradients, or gray tones `;
    prompt += `- Clean, continuous outlines with no gaps `;
    prompt += `- Closed shapes that can be easily filled with color `;
    prompt += `- Cartoon or illustration style, not photorealistic `;
    prompt += `- Ensure the result is suitable for printing and coloring with crayons, markers, or colored pencils. `;

    return prompt;
  }

  /**
   * Generate image from text with retry logic
   */
  private async generateFromTextWithRetry(prompt: string): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: this.config.model });

    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // ⏱️  START TIMING: Gemini API call (text-to-image)
        const geminiStartTime = Date.now();
        console.log(`⏱️  [Gemini API Text] Starting text-to-image generation (attempt ${attempt + 1}/${this.config.maxRetries + 1})`);

        const result = await model.generateContent([
          {
            text: prompt
          }
        ]);

        // ⏱️  END TIMING: Gemini API call
        const geminiDuration = Date.now() - geminiStartTime;
        console.log(`⏱️  [Gemini API Text] Response received in ${geminiDuration}ms (${(geminiDuration / 1000).toFixed(1)}s)`);

        // 🐢 Warn if slow
        if (geminiDuration > 10000) {
          console.warn(`🐢 [Gemini API Text] SLOW RESPONSE: ${geminiDuration}ms - Expected <10s`);
        }

        // 🚨 Critical if extremely slow
        if (geminiDuration > 60000) {
          console.error(`🚨 [Gemini API Text] CRITICAL LATENCY: ${geminiDuration}ms - This should be investigated`);
        }

        const response = await result.response;
        const candidates = response.candidates;

        if (candidates && candidates.length > 0) {
          const parts = candidates[0].content?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
              }
            }
          }
        }

        throw new Error('No image data returned from Gemini API');

      } catch (error) {
        lastError = error;
        const errorType = this.categorizeError(error);

        // Don't retry for non-retryable errors
        if (!errorType.retryable || attempt === this.config.maxRetries) {
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = this.config.retryDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Validate edit request
   */
  private validateEditRequest(request: EditRequest): void {
    if (!request.existingImageBase64) {
      throw new Error('Existing image data is required');
    }

    if (!request.mimeType) {
      throw new Error('MIME type is required');
    }

    if (!request.editPrompt || typeof request.editPrompt !== 'string') {
      throw new Error('Edit prompt is required');
    }

    if (request.editPrompt.length < 3) {
      throw new Error('Edit prompt must be at least 3 characters');
    }

    if (request.editPrompt.length > 200) {
      throw new Error('Edit prompt must be less than 200 characters');
    }

    if (!['simple', 'standard', 'detailed'].includes(request.complexity)) {
      throw new Error('Invalid complexity level');
    }

    if (!['thin', 'medium', 'thick'].includes(request.lineThickness)) {
      throw new Error('Invalid line thickness');
    }

    // Check base64 format
    try {
      Buffer.from(request.existingImageBase64, 'base64');
    } catch {
      throw new Error('Invalid base64 image data');
    }
  }

  /**
   * Validate text generation request
   */
  private validateTextRequest(request: TextGenerationRequest): void {
    if (!request.textPrompt || typeof request.textPrompt !== 'string') {
      throw new Error('Text prompt is required');
    }

    if (request.textPrompt.length < 5) {
      throw new Error('Text prompt must be at least 5 characters');
    }

    if (request.textPrompt.length > 500) {
      throw new Error('Text prompt must be less than 500 characters');
    }

    if (!['simple', 'standard', 'detailed'].includes(request.complexity)) {
      throw new Error('Invalid complexity level');
    }

    if (!['thin', 'medium', 'thick'].includes(request.lineThickness)) {
      throw new Error('Invalid line thickness');
    }
  }

  /**
   * Validate generation request
   */
  private validateRequest(request: GenerationRequest): void {
    if (!request.imageBase64) {
      throw new Error('Image data is required');
    }

    if (!request.mimeType) {
      throw new Error('MIME type is required');
    }

    if (!['simple', 'standard', 'detailed'].includes(request.complexity)) {
      throw new Error('Invalid complexity level');
    }

    if (!['thin', 'medium', 'thick'].includes(request.lineThickness)) {
      throw new Error('Invalid line thickness');
    }

    // Check base64 format
    try {
      Buffer.from(request.imageBase64, 'base64');
    } catch {
      throw new Error('Invalid base64 image data');
    }
  }

  /**
   * Get service configuration
   */
  getConfig(): GeminiServiceConfig {
    return { ...this.config };
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(maxRetries: number, retryDelayMs: number): void {
    this.config = {
      ...this.config,
      maxRetries: maxRetries as 3,
      retryDelayMs: retryDelayMs as 1000
    };
  }
}

// Factory function for easy instantiation
export function createGeminiService(apiKey: string, options?: Partial<GeminiServiceConfig>): GeminiService {
  const config: GeminiServiceConfig = {
    apiKey,
    model: 'gemini-2.5-flash-image-preview',
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 30000,
    ...options
  };

  return new GeminiService(config);
}