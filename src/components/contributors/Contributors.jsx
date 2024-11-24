import React from 'react'
import styles from "./Contributors.module.css"
import { User} from 'lucide-react';
import ContributorCard from './ContributorCard';

const Contributors = () => {
    const contributors = [
      {
        username: "Alice",
        tips: 150,
        posts: 35,
        icon: <User size={48} absoluteStrokeWidth />,
      },

      {
        username: "Charity",
        tips: 200,
        posts: 45,
        icon: <User size={48} absoluteStrokeWidth />,
      },

      {
        username: "Diana",
        tips: 250,
        posts: 55,
        icon: <User size={48} absoluteStrokeWidth />,
      },

    //   {
    //     username: "Eve",
    //     tips: 300,
    //     posts: 65,
    //     icon: <UserCheck size={48} absoluteStrokeWidth />,
    //   },
    //   {
    //     username: "Frank",
    //     tips: 350,
    //     posts: 75,
    //     icon: <UserCheck size={48} absoluteStrokeWidth />,
    //   },
    ];
  return (
    <section className={styles.contributor}>
        <h2>Top Contributors</h2>
        <ul className={styles.row}>
            {contributors.map((contribute,index) =>(
            <ContributorCard key={index} data={contribute} />
           ))}
        </ul>
    </section>
  )
}

export default Contributors