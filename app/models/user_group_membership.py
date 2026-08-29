from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class UserGroupMembership(Base):
    __tablename__ = "user_group_memberships"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    group_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
