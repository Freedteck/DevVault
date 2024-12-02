import React from 'react'
import './profile.css'

const Profile = () => {
    const user = {
      avatar: "https://www.example.com/avatar.jpg",
      name: "John Doe",
      bio: "Web developer, tech enthusiast, and blogger.",
    };
  return (
    <div className="profile-page">
      <aside className="sidebar">
        <img src={user.avatar} alt="User Avatar" className="avatar" />
        <h2>{user.name}</h2>
        <p className="bio">{user.bio}</p>
        <nav className="sidebar-nav">
          <a href="#overview" className="sidebar-link">
            Overview
          </a>
          <a href="#posts" className="sidebar-link">
            Posts
          </a>
          <a href="#settings" className="sidebar-link">
            Settings
          </a>
        </nav>
      </aside>

      <section className="main-content">
        <div id="overview" className="content-section">
          <h3>Overview</h3>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nesciunt voluptates laborum sit. Nesciunt possimus expedita cupiditate magni quasi aliquid delectus tempora eaque illum, est debitis et. At quo adipisci suscipit.</p>
        </div>
        <div id="posts" className="content-section">
          <h3>Posts</h3>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Delectus reiciendis cumque voluptatum dolores, dolor nostrum neque dolore fuga cupiditate, possimus quasi nobis. Eveniet id laboriosam harum? Tenetur alias beatae aut.</p>
        </div>
        <div id="settings" className="content-section">
          <h3>Settings</h3>
          <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Cupiditate at et ipsa amet tenetur architecto, provident delectus placeat earum, facilis corrupti assumenda iure quibusdam nam, suscipit vero maxime sunt qui.</p>
        </div>
      </section>
    </div>
  );
}

export default Profile