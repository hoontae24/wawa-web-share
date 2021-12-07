import { ColumnValue, Connection, Request, TYPES } from "tedious";

export class QueryManager {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  public execute(id: number): Promise<ColumnValue[] | null> {
    return new Promise((res, rej) => {
      const query = this.createQuery({ id });
      const request = new Request(query, (err) => err && rej(err));

      const data: ColumnValue[][] = [];
      request.on("row", (columns) => {
        data.push(columns);
      });

      // Close the connection after the final event emitted by the request, after the callback passes
      request.on("requestCompleted", () => {
        this.connection.close();
        res(data[0] ?? null);
      });
      this.connection.execSql(request);
    });
  }

  private createQuery(params: { id: number }) {
    const { id } = params;
    const query = `
      SELECT 
          *,
          (SELECT MAN_NAME FROM P_MAP_MAIN_MST WHERE MAN_APP = USD_APP AND MAN_MD=USD_MD) AS MAIN_NAME
      FROM 
          P_MAP_USED_MST JOIN P_MAP_USR_MST ON MUR_APP = USD_APP AND MUR_PHONE = USD_ENT_PHONE 
      WHERE USD_SEQ = ${id};
    `;
    return query;
  }
}
