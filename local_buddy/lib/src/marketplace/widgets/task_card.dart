
import 'package:flutter/material.dart';

class TaskCard extends StatelessWidget {
  final String title;
  final String description;
  final String price;

  const TaskCard({
    super.key,
    required this.title,
    required this.description,
    required this.price,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Text(title, style: Theme.of(context).textTheme.headline6),
          Text(description),
          Text(price),
        ],
      ),
    );
  }
}
