import { useAuth } from '@/components/AuthProvider';

const LAMBDA_ARN = 'arn:aws:lambda:ap-south-1:203918876766:function:homebuying-unified-s3-handler';

export interface S3File {
  key: string;
  lastModified: string;
  size: number;
  displayName: string;
}

export interface LambdaResponse {
  statusCode: number;
  body: any;
  error?: string;
}

class LambdaService {
  private async invokeLambda(toolName: string, arguments_: any, bearerToken: string): Promise<LambdaResponse> {
    try {
      const response = await fetch('/api/invoke-lambda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lambda_arn: LAMBDA_ARN,
          tool_name: toolName,
          arguments: arguments_,
          bearer_token: bearerToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle Lambda function errors (check nested body for error)
      if (result.body?.body) {
        try {
          const data = JSON.parse(result.body.body);
          if (!data.success && data.error) {
            throw new Error(data.error);
          }
        } catch (parseError) {
          // If parsing fails, continue with original result
        }
      }

      return result;
    } catch (error) {
      console.error('Lambda invocation failed:', error);
      throw error;
    }
  }

  async listInputFiles(bearerToken: string): Promise<S3File[]> {
    const response = await this.invokeLambda('list_s3_files', {
      prefix: 'input',
      max_keys: 100
    }, bearerToken);

    if (response.body?.statusCode === 200 && response.body?.body) {
      // Parse the nested JSON string
      const data = JSON.parse(response.body.body);
      if (data.success && data.files) {
        return data.files.map((file: any) => ({
          key: file.full_path,
          lastModified: file.last_modified,
          size: file.size,
          displayName: file.filename
        }));
      }
    }
    return [];
  }

  async listOutputFiles(bearerToken: string): Promise<S3File[]> {
    const response = await this.invokeLambda('list_s3_files', {
      prefix: 'output',
      max_keys: 100
    }, bearerToken);

    if (response.body?.statusCode === 200 && response.body?.body) {
      // Parse the nested JSON string
      const data = JSON.parse(response.body.body);
      if (data.success && data.files) {
        return data.files.map((file: any) => ({
          key: file.full_path,
          lastModified: file.last_modified,
          size: file.size,
          displayName: file.filename
        }));
      }
    }
    return [];
  }

  async readFile(fileKey: string, bearerToken: string): Promise<string> {
    // Pass the full path to Lambda - it will handle the path logic
    const response = await this.invokeLambda('read_s3_file', {
      file_path: fileKey
    }, bearerToken);

    if (response.body?.statusCode === 200 && response.body?.body) {
      // Parse the nested JSON string
      const data = JSON.parse(response.body.body);
      if (data.success && data.content) {
        return data.content;
      }
    }

    // Handle error case
    if (response.body?.body) {
      const data = JSON.parse(response.body.body);
      throw new Error(data.error || 'Failed to read file');
    }

    throw new Error('Failed to read file');
  }
}

export const lambdaService = new LambdaService();

// Custom hook for using Lambda service with auth
export function useLambdaService() {
  const { getBearerToken } = useAuth();

  const listInputFiles = async (): Promise<S3File[]> => {
    const token = await getBearerToken();
    if (!token) throw new Error('No authentication token');
    return lambdaService.listInputFiles(token);
  };

  const listOutputFiles = async (): Promise<S3File[]> => {
    const token = await getBearerToken();
    if (!token) throw new Error('No authentication token');
    return lambdaService.listOutputFiles(token);
  };

  const readFile = async (fileKey: string): Promise<string> => {
    const token = await getBearerToken();
    if (!token) throw new Error('No authentication token');
    return lambdaService.readFile(fileKey, token);
  };

  return {
    listInputFiles,
    listOutputFiles,
    readFile,
  };
}