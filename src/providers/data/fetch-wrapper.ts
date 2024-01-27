import { GraphQLFormattedError } from "graphql";

interface Error {
  message: string;
  statusCode: string;
}

//Acts as Middleware
const customFetch = async (url: string, options: RequestInit) => {
  const accessToken = localStorage.getItem("access_token");
  const headers = options.headers as Record<string, string>;

  return await fetch(url, {
    ...options,
    headers: {
      ...headers,
      Authorization: headers?.Authorization || `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Apollo-Require-Preflight": "true",
    },
  });
};

//Custom error handler fn()
const getGraphQLErrors = (
  body: Record<"errors", GraphQLFormattedError[] | undefined>
): Error | null => {
  if (!body) {
    return {
      message: "Unknown error",
      statusCode: "INTERNAL_SERVER_ERROR",
    };
  }

  if ("errors" in body) {
    const errors = body?.errors;

    const messages = errors?.map((error) => error?.message)?.join("");
    const code = errors?.[0]?.extensions?.code;

    return {
      message: messages || JSON.stringify(errors),
      statusCode: code || 500,
    };
  }

  return null; //Return null if no body and errors are there
};

export const fetchWrapper = async (url: string, options: RequestInit) => {
  const response = await customFetch(url, options);
  const responseClone = response.clone(); //Clone response to use it further
  const body = await responseClone.json();

  const error = getGraphQLErrors(body);

  if (error) {
    throw error;
  }

  return response;
};
