from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./cartoon-themed.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
<<<<<<< HEAD
    connect_args={"check_same_thread": False}
=======
    connect_args={"check_same_thread": False} 
>>>>>>> 1af0b00fc2551e4e9fad2f309eacf031e0b0b2fd
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()