from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import crud
from app.auth import get_current_user
from app.database import get_db
from app.models import Task
from app.schemas import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter()


def get_task_or_404(task_id: int, db: Session = Depends(get_db)) -> Task:
    task = crud.get_task(db, task_id)
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )
    return task


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    db: Session = Depends(get_db),
    _current_user: str = Depends(get_current_user),
) -> Task:
    return crud.create_task(db, task_in)


@router.get("", response_model=list[TaskResponse])
def list_tasks(
    completed: bool | None = Query(default=None, description="Filter by completion status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: str = Depends(get_current_user),
) -> list[Task]:
    return crud.get_tasks(db, completed=completed, skip=skip, limit=limit)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task: Task = Depends(get_task_or_404),
    _current_user: str = Depends(get_current_user),
) -> Task:
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_in: TaskUpdate,
    task: Task = Depends(get_task_or_404),
    db: Session = Depends(get_db),
    _current_user: str = Depends(get_current_user),
) -> Task:
    return crud.update_task(db, task, task_in)


@router.patch("/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    task: Task = Depends(get_task_or_404),
    db: Session = Depends(get_db),
    _current_user: str = Depends(get_current_user),
) -> Task:
    return crud.update_task(db, task, TaskUpdate(completed=True))


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task: Task = Depends(get_task_or_404),
    db: Session = Depends(get_db),
    _current_user: str = Depends(get_current_user),
) -> None:
    crud.delete_task(db, task)
