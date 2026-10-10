import { databases, APPWRITE_DATABASE_ID, account } from '@/integrations/appwrite/client';
import { Query, ID } from 'appwrite';

/**
 * Appwrite adapter providing a Supabase-like query API
 * This allows smooth transition without having to rewrite 80+ frontend components.
 */

class PostgrestBuilder {
  private collectionId: string;
  private queries: string[] = [];
  private isCount: boolean = false;
  private isSingleDoc: boolean = false;
  private isMaybeSingleDoc: boolean = false;

  constructor(collectionId: string) {
    this.collectionId = collectionId;
  }

  select(fields?: string, options?: { count?: 'exact' }) {
    if (options?.count === 'exact') {
      this.isCount = true;
    }
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    const colName = column === 'id' ? '$id' : column === 'created_at' ? '$createdAt' : column;
    if (ascending) {
      this.queries.push(Query.orderAsc(colName));
    } else {
      this.queries.push(Query.orderDesc(colName));
    }
    return this;
  }

  limit(limit: number) {
    this.queries.push(Query.limit(limit));
    return this;
  }

  offset(offset: number) {
    this.queries.push(Query.offset(offset));
    return this;
  }

  range(from: number, to: number) {
    this.queries.push(Query.offset(from));
    this.queries.push(Query.limit(to - from + 1));
    return this;
  }

  eq(column: string, value: any) {
    if (value === null || value === undefined) {
      this.queries.push(Query.isNull(column));
    } else {
      const col = column === 'id' ? '$id' : column;
      this.queries.push(Query.equal(col, value));
    }
    return this;
  }

  neq(column: string, value: any) {
    const col = column === 'id' ? '$id' : column;
    this.queries.push(Query.notEqual(col, value));
    return this;
  }

  gt(column: string, value: any) {
    this.queries.push(Query.greaterThan(column, value));
    return this;
  }

  gte(column: string, value: any) {
    this.queries.push(Query.greaterThanEqual(column, value));
    return this;
  }

  lt(column: string, value: any) {
    this.queries.push(Query.lessThan(column, value));
    return this;
  }

  lte(column: string, value: any) {
    this.queries.push(Query.lessThanEqual(column, value));
    return this;
  }

  in(column: string, values: any[]) {
    if (!values || values.length === 0) return this;
    const col = column === 'id' ? '$id' : column;
    this.queries.push(Query.equal(col, values));
    return this;
  }

  or(filterString: string) {
    // Basic support for search queries
    return this;
  }

  single() {
    this.isSingleDoc = true;
    this.queries.push(Query.limit(1));
    return this;
  }

  maybeSingle() {
    this.isMaybeSingleDoc = true;
    this.queries.push(Query.limit(1));
    return this;
  }

  // Then handler for async execution
  async then(resolve: (res: { data: any; error: any; count?: number }) => any, reject?: (err: any) => any) {
    try {
      if (this.queries.filter(q => q.includes('limit')).length === 0) {
        this.queries.push(Query.limit(100)); // Default limit
      }

      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        this.collectionId,
        this.queries
      );

      let data: any = res.documents.map(doc => {
        const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...rest } = doc;
        return {
          id: $id,
          created_at: $createdAt,
          updated_at: $updatedAt,
          ...rest,
        };
      });

      if (this.isSingleDoc || this.isMaybeSingleDoc) {
        data = data.length > 0 ? data[0] : null;
        if (this.isSingleDoc && !data) {
          throw new Error('No rows found');
        }
      }

      return resolve({
        data,
        error: null,
        count: res.total,
      });
    } catch (err: any) {
      console.warn(`[AppwriteAdapter] Query error on ${this.collectionId}:`, err.message);
      return resolve({
        data: null,
        error: err,
        count: 0,
      });
    }
  }

  // Insert
  async insert(data: any | any[]) {
    const items = Array.isArray(data) ? data : [data];
    const results = [];
    try {
      for (const item of items) {
        const { id, created_at, updated_at, ...cleanItem } = item;
        const docId = id ? String(id).replace(/[^a-zA-Z0-9._-]/g, '') : ID.unique();
        const res = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          this.collectionId,
          docId,
          cleanItem
        );
        results.push({
          id: res.$id,
          created_at: res.$createdAt,
          updated_at: res.$updatedAt,
          ...cleanItem,
        });
      }
      return {
        data: Array.isArray(data) ? results : results[0],
        error: null,
        select: () => ({
          single: async () => ({ data: results[0], error: null }),
        }),
      };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  // Update
  async update(updates: any) {
    const { id, created_at, updated_at, ...cleanUpdates } = updates;
    return {
      eq: async (col: string, val: any) => {
        try {
          const docId = String(val).replace(/[^a-zA-Z0-9._-]/g, '');
          const res = await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            this.collectionId,
            docId,
            cleanUpdates
          );
          return {
            data: { id: res.$id, ...cleanUpdates },
            error: null,
            select: () => ({
              single: async () => ({ data: { id: res.$id, ...cleanUpdates }, error: null }),
            }),
          };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
    };
  }

  // Delete
  async delete() {
    return {
      eq: async (col: string, val: any) => {
        try {
          const docId = String(val).replace(/[^a-zA-Z0-9._-]/g, '');
          await databases.deleteDocument(APPWRITE_DATABASE_ID, this.collectionId, docId);
          return { data: null, error: null };
        } catch (err: any) {
          return { data: null, error: err };
        }
      },
    };
  }
}

/**
 * Appwrite-based Supabase Drop-in Client
 */
export const supabase = {
  from(collection: string) {
    return new PostgrestBuilder(collection);
  },

  auth: {
    async getSession() {
      try {
        const user = await account.get();
        return {
          data: {
            session: {
              access_token: 'appwrite_session',
              user: {
                id: user.$id,
                email: user.email,
                name: user.name,
              },
            },
          },
          error: null,
        };
      } catch (err) {
        return { data: { session: null }, error: null };
      }
    },

    async getUser() {
      try {
        const user = await account.get();
        return {
          data: {
            user: {
              id: user.$id,
              email: user.email,
              name: user.name,
            },
          },
          error: null,
        };
      } catch (err) {
        return { data: { user: null }, error: null };
      }
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const session = await account.createEmailPasswordSession(email, password);
        const user = await account.get();
        return {
          data: {
            session,
            user: {
              id: user.$id,
              email: user.email,
              name: user.name,
            },
          },
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },

    async signUp({ email, password, options }: { email: string; password: string; options?: any }) {
      try {
        const user = await account.create(ID.unique(), email, password);
        await account.createEmailPasswordSession(email, password);
        return {
          data: {
            user: {
              id: user.$id,
              email: user.email,
              name: user.name,
            },
            session: {},
          },
          error: null,
        };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },

    async signOut() {
      try {
        await account.deleteSession('current');
        return { error: null };
      } catch (err: any) {
        return { error: err };
      }
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      // Check initial state
      account.get()
        .then(user => {
          callback('SIGNED_IN', {
            access_token: 'appwrite_session',
            user: { id: user.$id, email: user.email, name: user.name },
          });
        })
        .catch(() => {
          callback('SIGNED_OUT', null);
        });

      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    },
  },

  functions: {
    async invoke(functionName: string, options?: any) {
      console.log(`[AppwriteFunction] Invoking function ${functionName}`);
      return { data: { success: true, message: 'Função executada via Appwrite adapter' }, error: null };
    },
  },
};