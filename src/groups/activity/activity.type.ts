export interface GroupActivityPost {
  uuid: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateGroupActivityPostInput {
  content: string;
}

export interface UpdateGroupActivityPostInput {
  content?: string;
}

export interface CreateGroupActivityLikeInput {
  post_id: string;
}

export interface GroupActivityLikeResponse {
  uuid: string;
  post_id: string;
  user_id: string;
  created_at: Date;
}

export interface CreateGroupActivityCommentInput {
  content: string;
}

export interface GroupActivityCommentResponse {
  uuid: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  user?: {
    uuid: string;
    name?: string;
    avatar_url?: string;
  }
} 