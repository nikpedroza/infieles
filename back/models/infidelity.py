from sqlalchemy import Column, Text, String, Date, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from uuid import uuid4
from database import Base

class Infidelidades(Base):
    __tablename__ = "infidelity"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    fecha_creacion = Column(Date, nullable=False, default=func.now())
    historia = Column(Text, nullable=False)

    evidencias = relationship("InfidelidadesEvidencia", lazy="selectin")

class InfidelidadesEvidencia(Base):
    __tablename__ = "infidelity_photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    infidelity_id = Column(UUID(as_uuid=True), ForeignKey("infidelity.id"), nullable=False)
    path = Column(String, nullable=False)