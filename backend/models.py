<<<<<<< HEAD
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
=======
from sqlalchemy import Column, Integer, String, Float, ForeignKey
>>>>>>> 1af0b00fc2551e4e9fad2f309eacf031e0b0b2fd
from sqlalchemy.orm import relationship
from backend.database import Base


class Restaurante(Base):
    __tablename__ = "restaurantes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
<<<<<<< HEAD
    categoria = Column(String, nullable=True)
    descricao = Column(Text, nullable=True)
    endereco = Column(String, nullable=True)
    telefone = Column(String, nullable=True)
=======
>>>>>>> 1af0b00fc2551e4e9fad2f309eacf031e0b0b2fd

    cardapio = relationship(
        "Comida",
        back_populates="restaurante",
        cascade="all, delete-orphan"
    )


class Comida(Base):
    __tablename__ = "comidas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    preco = Column(Float, nullable=False)
    restaurante_id = Column(Integer, ForeignKey("restaurantes.id"), nullable=False)

    restaurante = relationship("Restaurante", back_populates="cardapio")