from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class BoardResponse(BaseModel):
    id: str
    code: str
    name: str

class ClassResponse(BaseModel):
    id: str
    grade: int
    name: str

class StreamResponse(BaseModel):
    id: str
    code: str
    name: str

class SubjectResponse(BaseModel):
    id: str
    class_id: str
    board_id: str
    stream_id: Optional[str] = None
    name: str
    code: str
    icon: str
    color: str

class SubtopicResponse(BaseModel):
    id: str
    topic_id: str
    title: str
    order: int
    concept_tag: str
    prerequisite_subtopic_id: Optional[str] = None
    mastery: Optional[float] = None
    status: Optional[str] = None

class TopicResponse(BaseModel):
    id: str
    chapter_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    source: str
    mode_origin: str
    status: str
    order: int
    overall_mastery: Optional[float] = None
    subtopics: Optional[List[SubtopicResponse]] = None

class ChapterResponse(BaseModel):
    id: str
    subject_id: str
    title: str
    order: int
    topics: Optional[List[TopicResponse]] = None
