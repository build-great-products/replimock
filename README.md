# Replimock

[![npm version](https://img.shields.io/npm/v/@roughapp/replimock.svg)](https://www.npmjs.com/package/@roughapp/replimock)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A lightweight, intuitive testing utility for mocking [Replicache](https://replicache.dev/) clients in your unit and integration tests.

## Why Use Replimock?

When building applications with Replicache, testing can be challenging because the real Replicache client requires IndexedDB and a full sync infrastructure. Replimock solves this problem by providing:

- **Simplified Testing**: Test your Replicache mutators and queries without the need for a real database or sync infrastructure
- **Fast Tests**: No network or indexedDB means your tests run lightning fast
- **Predictable Environment**: Full control over the Replicache client state for deterministic testing
- **API Compatibility**: Works with the standard Replicache client API, so your tests reflect real usage

## Installation

```bash
# Using npm
npm install @roughapp/replimock --save-dev

# Using yarn
yarn add @roughapp/replimock --dev

# Using pnpm
pnpm add @roughapp/replimock --save-dev
```

## Usage

Replimock provides a simple API to create a mock Replicache client that mimics the behavior of a real Replicache client.

### Basic Example

```typescript
import { mockReplicache } from '@roughapp/replimock';
import { expect, test } from 'vitest'; // or your testing framework of choice

test('should add a new todo', async () => {
  // Create a mock Replicache client
  const rep = mockReplicache({
    mutators: {
      addTodo: async (tx, todo) => {
        await tx.set(`todo/${todo.id}`, todo);
        return todo;
      },
    },
  });

  // Use the mock client just like you would use a real Replicache client
  const todo = await rep.mutate.addTodo({ id: '123', text: 'Buy milk', done: false });

  // Query the data to verify the mutation worked
  const storedTodo = await rep.query(tx => tx.get(`todo/${todo.id}`));

  expect(storedTodo).toEqual({ id: '123', text: 'Buy milk', done: false });
});
```

### With Initial Data

You can initialize the mock client with data:

```typescript
const rep = mockReplicache({
  initialData: {
    'todo/1': { id: '1', text: 'Existing todo', done: false },
    'todo/2': { id: '2', text: 'Another todo', done: true },
  },
  mutators: {
    // your mutators here
  },
});

// Query existing data
const todos = await rep.query(tx => tx.scan({ prefix: 'todo/' }).values().toArray());
console.log(todos); // will include the initial data
```

### Testing Watchers

Replimock supports the `experimentalWatch` API for testing reactive code:

```typescript
import { mockReplicache } from '@roughapp/replimock';
import { vi } from 'vitest';

test('should call watcher when data changes', async () => {
  const rep = mockReplicache({
    mutators: {
      addTodo: async (tx, todo) => {
        await tx.set(`todo/${todo.id}`, todo);
      },
    },
  });

  const watcher = vi.fn();
  rep.experimentalWatch(watcher, { prefix: 'todo/' });

  // Trigger a mutation that should notify the watcher
  await rep.mutate.addTodo({ id: '123', text: 'New todo', done: false });

  // Wait for the next tick to allow the callback to be called
  await new Promise(resolve => setTimeout(resolve, 0));

  expect(watcher).toHaveBeenCalledWith([
    {
      op: 'add',
      key: 'todo/123',
      newValue: { id: '123', text: 'New todo', done: false }
    }
  ]);
});
```

## API

### mockReplicache(options)

Creates a mock Replicache client.

**Options:**

- `mutators`: Object containing mutator functions (required)
- `initialData`: Object containing initial data to populate the store (optional)

The returned mock client implements the Replicache API, focusing on the most commonly used features:

- `query`: Execute read-only operations
- `mutate`: Execute mutations
- `experimentalWatch`: Watch for changes to data

## Limitations

Replimock aims to provide a testing environment that's faithful to the real Replicache API, but there are some limitations:

- Indexes are not fully supported
- Some advanced features like conflict resolution might behave differently
- Network-related features (push/pull/sync) are stubbed out

## License

MIT

## Contributing

Contributions are welcome! Please feel free to open issues or PRs on [GitHub](https://github.com/build-great-products/replimock).
