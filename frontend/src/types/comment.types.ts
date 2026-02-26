export interface CommentAuthor {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface Comment {
  id: string;
  body: string;
  isEdited: boolean;
  ticketId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}
