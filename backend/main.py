\
\
\
\
   

import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import supabase_client

app = FastAPI(
    title="Project Node API",
    description="Backend API for Project Node residential community platform",
    version="1.0.0"
)

                                   
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

                                                                              
                  
                                                                              

class NameCardModel(BaseModel):
    fullName: str = Field(..., min_length=1, description="Full name is required")
    phone: str = Field(..., min_length=1, description="Phone number is required")
    unit: Optional[str] = None
    occupation: Optional[str] = None
    bio: Optional[str] = None
    email: Optional[str] = None
    handle: Optional[str] = None
    helperTags: Optional[List[str]] = []

class ProfileModel(BaseModel):
    appearanceName: str = Field(..., min_length=1)
    nameCard: NameCardModel

class NotificationModel(BaseModel):
    id: str
    type: str
    title: str
    description: str
    time: str
    tag: str
    actionText: Optional[str] = None
    icon: Optional[str] = None

class PostModel(BaseModel):
    id: Optional[str] = None
    authorName: str
    unit: str
    phone: Optional[str] = None
    occupation: Optional[str] = None
    bio: Optional[str] = None
    time: Optional[str] = "Just now"
    tag: str = "Community"
    category: str = "feed"
    content: str = Field(..., min_length=1)
    likes: int = 0
    likedByUser: bool = False
    commentsCount: int = 0

                                                                              
                                                              
                                                                              

mock_profile = {
    "appearanceName": "Alex Rivera",
    "nameCard": {
        "fullName": "Alex Rivera",
        "phone": "+1 (555) 392-8192",
        "unit": "Block 4, #07-12",
        "occupation": "Landscape Designer",
        "bio": "Living in Block 4 since 2022. Weekend cyclist & urban gardener. Always glad to lend tools or help neighbors!",
        "email": "alex.rivera@residence.node",
        "handle": "@alex_rivera",
        "helperTags": ["Tool Sharing", "Plant Care", "Pet Sitting"]
    }
}

mock_notifications = [
    {
        "id": "notif-1",
        "type": "urgent",
        "title": "Urgent: Water Supply Pipeline Maintenance",
        "description": "Scheduled maintenance for main water supply line tomorrow from 10:00 AM to 2:00 PM. Affected units: Block A & B. Please store necessary water beforehand.",
        "time": "35 mins ago",
        "tag": "Maintenance",
        "actionText": "View Schedule",
        "icon": '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.79 6 9.14 0 3.63-2.65 6.2-6 6.2z"/></svg>'
    },
    {
        "id": "notif-2",
        "type": "package",
        "title": "Smart Parcel Locker Delivery",
        "description": "Your courier parcel has been placed in Ground Floor Smart Locker #18. Use Pickup PIN: 8492. Locker reserved for 48 hours.",
        "time": "2 hours ago",
        "tag": "Delivery",
        "actionText": "Locker PIN: 8492",
        "icon": '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>'
    },
    {
        "id": "notif-3",
        "type": "event",
        "title": "Annual Neighborhood BBQ & Community Meetup",
        "description": "Join your fellow residents this Saturday at 5:00 PM in the Central Courtyard! Food, soft drinks, and kids activities provided. RSVP to assist catering count.",
        "time": "5 hours ago",
        "tag": "Event",
        "actionText": "RSVP Attendance",
        "icon": '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>'
    },
    {
        "id": "notif-4",
        "type": "notice",
        "title": "New Digital Visitor QR Pass Active at Main Gate",
        "description": "Security has updated the visitor intercom system. You can now issue guest QR passes directly via the Project Node directory for faster entry.",
        "time": "Yesterday",
        "tag": "Security Notice",
        "actionText": "Read Guidelines",
        "icon": '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>'
    }
]

mock_posts = [
    {
        "id": "post-1",
        "authorName": "Sarah Chen",
        "unit": "Block 4, #08-12",
        "phone": "+1 (555) 482-1983",
        "occupation": "Botanist & Organic Baker",
        "bio": "Balcony gardening enthusiast. Always happy to share fresh cuttings and starter sourdough!",
        "time": "18 mins ago",
        "tag": "Sharing",
        "category": "feed",
        "content": "Harvested fresh organic mint and fragrant rosemary from our balcony garden today. Six bundled packs are available in the ground lobby sharing basket. Please take what you need for tonight's cooking.",
        "likes": 12,
        "likedByUser": False,
        "commentsCount": 3
    },
    {
        "id": "post-2",
        "authorName": "Marcus Vance",
        "unit": "Block 2, #04-06",
        "phone": "+1 (555) 720-3341",
        "occupation": "Software Engineer",
        "bio": "Lover of table tennis and board games. Free on weekends.",
        "time": "1 hour ago",
        "tag": "Sports",
        "category": "feed",
        "content": "Organizing casual table tennis singles & doubles at the community clubhouse this Sunday at 3:00 PM. All skill levels welcome. Send a message if you would like to join.",
        "likes": 8,
        "likedByUser": False,
        "commentsCount": 5
    },
    {
        "id": "post-3",
        "authorName": "Dr. Priya Patel",
        "unit": "Block 1, #11-04",
        "phone": "+1 (555) 619-8902",
        "occupation": "Pediatric Specialist",
        "bio": "Mother of two. Living here since 2020.",
        "time": "3 hours ago",
        "tag": "Recommendation",
        "category": "feed",
        "content": "Seeking recommendations for a trustworthy local electrician to inspect ceiling fan fixtures in Block 1. Any tested recommendations from neighbors are greatly appreciated.",
        "likes": 5,
        "likedByUser": False,
        "commentsCount": 7
    },
    {
        "id": "post-4",
        "authorName": "Elena Rostova",
        "unit": "Block 3, #02-15",
        "phone": "+1 (555) 901-4472",
        "occupation": "Graphic Artist",
        "bio": "Cat mom and cyclist.",
        "time": "5 hours ago",
        "tag": "Lost & Found",
        "category": "lostfound",
        "content": "Found: A silver keychain with three keys and a bicycle charm near the bike racks by Gate 2. Delivered to the security guard post for safekeeping.",
        "likes": 16,
        "likedByUser": False,
        "commentsCount": 2
    }
]

                                                                              
               
                                                                              

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "Project Node",
        "backend": "Python FastAPI",
        "database": "Supabase" if supabase_client else "In-Memory / Offline"
    }

@app.get("/api/profile")
def get_profile():
    if supabase_client:
        try:
            res = supabase_client.table("profiles").select("*, name_cards(*)").limit(1).execute()
            if res.data:
                return res.data[0]
        except Exception as e:
            print(f"Supabase query error: {e}")
    return mock_profile

@app.post("/api/profile")
def update_profile(profile: ProfileModel):
                                                      
    if not profile.nameCard.fullName.strip():
        raise HTTPException(status_code=400, detail="Full Name is required on name card")
    if not profile.nameCard.phone.strip():
        raise HTTPException(status_code=400, detail="Phone number is required on name card")

    if supabase_client:
        try:
                                  
            supabase_client.table("profiles").upsert({
                "appearance_name": profile.appearanceName
            }).execute()
            supabase_client.table("name_cards").upsert({
                "full_name": profile.nameCard.fullName,
                "phone": profile.nameCard.phone,
                "unit": profile.nameCard.unit,
                "occupation": profile.nameCard.occupation,
                "bio": profile.nameCard.bio,
                "email": profile.nameCard.email,
                "handle": profile.nameCard.handle,
                "helper_tags": profile.nameCard.helperTags
            }).execute()
        except Exception as e:
            print(f"Supabase upsert error: {e}")

                            
    global mock_profile
    mock_profile = profile.model_dump()
    return {"message": "Profile updated successfully", "data": mock_profile}

@app.get("/api/notifications")
def get_notifications():
    if supabase_client:
        try:
            res = supabase_client.table("notifications").select("*").eq("is_active", True).execute()
            if res.data:
                return res.data
        except Exception as e:
            print(f"Supabase notifications error: {e}")
    return mock_notifications

@app.delete("/api/notifications/{notification_id}")
def dismiss_notification(notification_id: str):
    global mock_notifications
    mock_notifications = [n for n in mock_notifications if n["id"] != notification_id]
    return {"message": "Notification dismissed", "id": notification_id}

@app.get("/api/feed")
def get_feed():
    if supabase_client:
        try:
            res = supabase_client.table("community_posts").select("*").order("created_at", desc=True).execute()
            if res.data:
                return res.data
        except Exception as e:
            print(f"Supabase feed error: {e}")
    return mock_posts

@app.post("/api/feed", status_code=status.HTTP_201_CREATED)
def create_feed_post(post: PostModel):
    new_id = f"post-{len(mock_posts) + 1}"
    post_dict = post.model_dump()
    post_dict["id"] = new_id

    if supabase_client:
        try:
            supabase_client.table("community_posts").insert({
                "author_name": post.authorName,
                "unit": post.unit,
                "phone": post.phone,
                "occupation": post.occupation,
                "bio": post.bio,
                "tag": post.tag,
                "category": post.category,
                "content": post.content
            }).execute()
        except Exception as e:
            print(f"Supabase insert error: {e}")

    mock_posts.insert(0, post_dict)
    return {"message": "Post created successfully", "post": post_dict}

@app.post("/api/feed/{post_id}/like")
def toggle_like_post(post_id: str):
    for post in mock_posts:
        if post["id"] == post_id:
            if post.get("likedByUser", False):
                post["likes"] -= 1
                post["likedByUser"] = False
            else:
                post["likes"] += 1
                post["likedByUser"] = True
            return {"likes": post["likes"], "likedByUser": post["likedByUser"]}
    raise HTTPException(status_code=404, detail="Post not found")

                                                                              
                             
                                                                              
                                                 
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

                                   
app.mount("/css", StaticFiles(directory=os.path.join(PROJECT_ROOT, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(PROJECT_ROOT, "js")), name="js")

                       
@app.get("/")
def read_root():
    from fastapi.responses import FileResponse
    return FileResponse(os.path.join(PROJECT_ROOT, "index.html"))

@app.get("/favicon.svg")
def get_favicon_svg():
    from fastapi.responses import FileResponse
    return FileResponse(os.path.join(PROJECT_ROOT, "favicon.svg"), media_type="image/svg+xml")

@app.get("/favicon.ico")
def get_favicon_ico():
    from fastapi.responses import FileResponse
    return FileResponse(os.path.join(PROJECT_ROOT, "favicon.ico"), media_type="image/x-icon")

@app.get("/apple-touch-icon.png")
def get_apple_touch_icon():
    from fastapi.responses import FileResponse
    return FileResponse(os.path.join(PROJECT_ROOT, "apple-touch-icon.png"), media_type="image/png")

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*60)
    print(" Project Node - Residential Community Platform")
    print(" Serving Web App & API at: http://127.0.0.1:8000")
    print(" API Documentation:        http://127.0.0.1:8000/docs")
    print("="*60 + "\n")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
