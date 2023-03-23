// src/server.ts
import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import dotenv from 'dotenv';
import e from "express";

// Laden Sie die Umgebungsvariablen aus der .env-Datei --> Port 4000
dotenv.config();

const app = express();
app.use(express.json());

interface Project {
  id: string;
  name: string;
  client: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TimeEntry {
  id: string;
  employeeId: string;
  projectId: string;
  task: string;
  minutes: number;
  date: string;
}

const dataFile = "./data.json";


const loadData = (): { projects: Project[]; employees: Employee[]; timeEntries: TimeEntry[] } => {
  try {
    const dataBuffer = fs.readFileSync(dataFile);
    const dataJson = dataBuffer.toString();
    return JSON.parse(dataJson);
  } catch (error) {
    return {
      projects: [],
      employees: [],
      timeEntries: [],
    };
  }
};

const saveData = (data: { projects: Project[]; employees: Employee[]; timeEntries: TimeEntry[] }): void => {
  const dataJson = JSON.stringify(data);
  fs.writeFileSync(dataFile, dataJson);
};

// get all projects
app.get("/projects", (req: Request, res: Response) => {  
  const data = loadData()
  const { projects } = data
  res.send(projects).status(200)
})


app.post("/projects", (req: Request, res: Response) => {
  const { name, client } = req.body;
  if(!name || !client){
    res.send("No empty entries!")
  }else{
  const newProject: Project = { id: uuidv4(), name, client };
  const data = loadData();

  //check for double project name
  const clientsProjects = data.projects.filter((project) => project.client === client)
  const sameName = clientsProjects.filter((project) => project.name === name)
  if(sameName.length > 0){
    res.send("Naming Error!")
  }else{
    //---------
    data.projects.push(newProject);
    saveData(data);
    res.status(201).json(newProject);
    }
  }
});

//get all employees
app.get("/employees", (req:Request, res: Response) => {
  const data = loadData()
  const { employees } = data
  res.json(employees).status(200)
})

app.post("/employees", (req: Request, res: Response) => {
  const { firstName, lastName, email } = req.body;
  const newEmployee: Employee = { id: uuidv4(), firstName, lastName, email };
  const data = loadData();
  data.employees.push(newEmployee);
  saveData(data);
  res.status(201).json(newEmployee);
});

app.post("/timeEntries", (req: Request, res: Response) => {
  const { employeeId, projectId, task, minutes } = req.body;

  const todayDate = new Date()
  const date = todayDate.toString()

  const newTimeEntry: TimeEntry = {
    id: uuidv4(),
    employeeId,
    projectId,
    task,
    minutes,
    date
  };
  const data = loadData();

  //------------- check 8 hour rule 
  const allTimeEntries = loadData().timeEntries
  const filtered = allTimeEntries.filter((entry) => (new Date(entry.date).getDate() === todayDate.getDate() && new Date(entry.date).getMonth() === todayDate.getMonth() && new Date(entry.date).getFullYear() === todayDate.getFullYear())
    )  
    const allMinutes = filtered.reduce((acc, current) => acc + current.minutes, 0)
  
  if( allMinutes + minutes <= 480){
    data.timeEntries.push(newTimeEntry);
    saveData(data);
    res.status(201).json(newTimeEntry);
  }else{
    res.send("Not possible to log over 8 hours!")
  }
});

// entry one employee
app.get("/timeEntries/:Id", (req, res) => {
  const {Id} = req.params
  const allUsers = loadData().employees
  const allTimeEntries = loadData().timeEntries
  const filtered = allTimeEntries.filter((entry) => entry.employeeId === Id)
  
  if(filtered.length > 0){
    res.status(200).send(filtered)
  }else{
    res.status(404).send("Employee not found!")
  }
})


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port 4000 || 3000`);
});
