export class CreateHelpCenterTopicResponseDTO {
  status_code: number;
  status: string;
  message: string;
  data: {
    id: string;
    title: string;
    content: string;
    author: string;
    is_deleted: boolean;
    created_at: Date;
    updated_at: Date;
  };
}
