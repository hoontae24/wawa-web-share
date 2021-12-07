import { Connection } from "tedious";

export const createConnection = (config: {
  server: string;
  username: string;
  password: string;
  database: string;
}): Promise<Connection> => {
  const _config = {
    server: config.server,
    authentication: {
      type: "default",
      options: {
        userName: config.username,
        password: config.password,
      },
    },
    options: {
      // If you are on Microsoft Azure, you need encryption:
      encrypt: true,
      database: config.database,
    },
  };

  const connection = new Connection(_config);

  return new Promise((res, rej) => {
    connection.on("connect", (err) => (err ? rej(err) : res(connection)));
    connection.connect();
  });
};
