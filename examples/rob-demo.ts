/**
 * ROB THE QUIETBUILDER - EXAMPLE USAGE
 * 
 * This demonstrates how to use Rob to build an app programmatically.
 */

// 1. Initialize a Rob session
const initResponse = await fetch('/api/rob/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'blank',
    appName: 'My Task Manager',
  }),
});

const { sessionId } = await initResponse.json();
console.log('Session created:', sessionId);

// 2. Send messages to Rob
const messageResponse = await fetch('/api/rob/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    message: 'I want to build a task management app with React. It should have:\n- Add/delete tasks\n- Mark tasks complete\n- Filter by status\n- Local storage persistence',
  }),
});

const { reply, state, receipts } = await messageResponse.json();
console.log('Rob replied:', reply);
console.log('Current state:', state);
console.log('Receipts created:', receipts.length);

// 3. Continue the conversation
const followUpResponse = await fetch('/api/rob/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    message: 'Yes, that looks good! Please generate the code.',
  }),
});

const { code, deployUrl } = await followUpResponse.json();
console.log('Generated code:', code);

// 4. Create GitHub repo (optional)
const repoResponse = await fetch('/api/github/create-repo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    repoName: 'my-task-manager',
    description: 'Task management app built with Rob',
  }),
});

const { repoUrl } = await repoResponse.json();
console.log('Repo created:', repoUrl);
