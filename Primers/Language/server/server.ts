import express, { Request, Response } from 'express';
import cors from 'cors';


// NOTE: you may modify these interfaces
interface Student {
  id: number;
  name: string;
}

interface GroupSummary {
  id: number;
  groupName: string;
  members: number[];
}

interface Group {
  id: number;
  groupName: string;
  members: Student[];
}

const app = express();
const port = 3902;

app.use(cors());
app.use(express.json());

// in-memory storage
let groups: Group[] = [];
let groupSummary: GroupSummary[] = [];
let students: Student[] = [];

// increment groupId and studentId
let groupId = 1;
let studentId = 1;

/**
 * Route to get all groups
 * @route GET /api/groups
 * @returns {Array} - Array of group objects
 */
app.get('/api/groups', (req: Request, res: Response) => {
  res.json(groupSummary);
});

/**
 * Route to get all students
 * @route GET /api/students
 * @returns {Array} - Array of student objects
 */
app.get('/api/students', (req: Request, res: Response) => {
  res.json(students);
});

/**
 * Route to add a new group
 * @route POST /api/groups
 * @param {string} req.body.groupName - The name of the group
 * @param {Array} req.body.members - Array of member names
 * @returns {Object} - The created group object
 */
app.post('/api/groups', (req: Request, res: Response) => {
  const { groupName, members } = req.body;

  // edge case: invalid or empty group name 
  if (typeof groupName !== 'string' || groupName.trim() === '') {
    return res.status(404).send("Invalid group name");
  }

  const newMembers = members.map((name: string) => {
    const student = { id: studentId++, name };
    students.push(student);
    return student;
  });

  const group = { id: groupId++, groupName, members: newMembers };
  groups.push(group);

  res.json({
    id: group.id,
    groupName: group.groupName,
    members: newMembers.map((m: Student) => m.id),
  });
});

/**
 * Route to delete a group by ID
 * @route DELETE /api/groups/:id
 * @param {number} req.params.id - The ID of the group to delete
 * @returns {void} - Empty response with status code 204
 */
app.delete('/api/groups/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const index = groups.findIndex(g => g.id === id);

  const removedGroup = groups.splice(index, 1)[0];
  removedGroup.members.forEach(member =>
    students = students.filter(s => s.id !== member.id)
  );

  res.sendStatus(204); // send back a 204 (do not modify this line)
});

/**
 * Route to get a group by ID (for fetching group members)
 * @route GET /api/groups/:id
 * @param {number} req.params.id - The ID of the group to retrieve
 * @returns {Object} - The group object with member details
 */
app.get('/api/groups/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const group = groups.find(g => g.id === id);

  if (!group) {
    return res.status(404).send("Group not found")
  };

  res.json(group);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});