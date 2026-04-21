export abstract class DomainError extends Error {
  abstract code: string;
}
