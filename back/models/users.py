from sqlalchemy.orm import relationship
from sqlalchemy import Column, String, Date, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from database import Base

class Usuario(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    fecha_creacion = Column(TIMESTAMP, nullable=False, server_default=func.now())
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    fecha_de_nacimiento = Column(Date, nullable=False)
    dni = Column(String, nullable=True)
    foto_perfil = Column(String, nullable=False)

    redes_sociales = relationship("SocialMedia", lazy="selectin")
    infidelidades = relationship("Infidelidades", lazy="selectin")
    comentarios = relationship("Comentarios", lazy="selectin")
    